'use strict';

const functions = require('firebase-functions');
const Firestore = require('@google-cloud/firestore');

// Max number of tasks per creator
const MAX_TASK_PER_CREATOR = 80;

const onNewProjectMakeAdminFunctions = require('./on-new-project-make-admin');

exports.onNewProjectMakeAdminFunctions = onNewProjectMakeAdminFunctions;

// Limit the number of tasks by creator
exports.limitTasksPerCreatorFirestore = functions.firestore.document('/tasks/{taskId}').onCreate((snap, context) => {
  console.log("On create");
  const parentRef = snap.ref.parent;
  const task = snap.data();

  // If delete occur or this is an existing record or no creator
  if (!task || !task.creator || !task.creator.id)
    return;

  const creatorId = task.creator.id;

  return parentRef.where('creator.id',"==", creatorId).get().then(snapshot => {

    if(snapshot.size >= MAX_TASK_PER_CREATOR) {
      return snap.ref.delete();
    }
  });
});


//----------------SendEmail----------------

// TODO: Configure the `email.from`, `send_notifications`, `email.apikey`, `email.domain` Google Cloud environment variables.
// For example: firebase functions:config:set email.send_notifications="true"
const shouldSendNotifications = encodeURIComponent(functions.config().email.send_notifications);
const fromEmail = decodeURIComponent(functions.config().email.from);
const emailApiKey = encodeURIComponent(functions.config().email.apikey);
const emailDomain = encodeURIComponent(functions.config().email.domain);

console.log(`Should send notifications: ${shouldSendNotifications}`);
console.log(fromEmail);
console.log(emailApiKey);
console.log(emailDomain);
const mailgun = require('mailgun-js')({apiKey:emailApiKey, domain:emailDomain})

exports.firestore = new Firestore();

exports.sendEmail = functions.firestore.document('/comments/{commentId}').onWrite((change, context)=> {

  if(!shouldSendNotifications) {
    console.log('send notifications turned off');
    return;
  }

  const comment = change.after.data();

  // Check for deleted comment
  if(!comment || !comment.taskId) {
    return
  }

  return firestore.collection('tasks').doc(comment.taskId).get().then( taskSnapshot => {
    const task = taskSnapshot.data();
    if(!task || !task.creator || !task.creator.email) {
      console.log('No email found');
      return;
    }

    function getEmailParams(toEmail) {
      const mailOptions = {
        from: comment.creator.name + ' ' + fromEmail, // For example Gal Bracha <support@doocrate.com>
        to: toEmail,
        'h:Reply-To': comment.creator.email
      };


      const emailTemplate = `<div style="direction:rtl;"><h2>הערה חדשה</h2>
        <span>
        מאת: 
        ${comment.creator.name} ${comment.creator.email}
        </span>
        <div><img src='${comment.creator.photoURL}' style='display:block; border-radius:70px;width:140px;height:140px;'/></div><br/>
        
        <button style='background:#eb1478;cursor: pointer;color: white;padding:0.7em;font-size:0.8em;-webkit-border-radius: 3px;-moz-border-radius: 3px;border-radius: 3px;margin:20px'>
          <a style='text-decoration: none;color: white' href='https://doocrate.com/task/${comment.taskId}'>
          לחץ כאן למעבר למשימה
          </a>
        </button>
        <h3>תוכן: ${comment.body}</h3> <br/>
        <br>אם ברצונך להסיר את עצמך מנוטיפקציות כאלו. אנא שלח אימייל ל-burnerot@gmail.com
        <br>        דואוקרט
        </div>
      `;

      const shortTitle = task.title.substr(0, 20);
      mailOptions.subject = `הערה חדשה - [${shortTitle}]`;
      mailOptions.html = emailTemplate;
      return mailOptions;
    }

    const creatorEmail = task.creator.email;
    let promises = [];

    promises.push(mailgun.messages().send(getEmailParams(creatorEmail)));
    if(task.assignee && task.assignee.email && task.assignee.email !== creatorEmail) {
      promises.push(mailgun.messages().send(getEmailParams(task.assignee.email)));
    }

    return Promise.all(promises).then(values => {
      console.log('email sent successfully');
    }).catch(error => {
      console.error('error sending mail:', error);
    });
  }
)});
