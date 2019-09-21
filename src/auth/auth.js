import { firebaseAuth, firebaseDb } from 'src/firebase';
import * as authActions from './actions';
import {getCookie} from "../utils/browser-utils";

export function initAuth(dispatch) {
  return new Promise((resolve, reject) => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(
      authUser => {
        if(authUser) {
          authUser.role = 'user';
        }
        getIsAdmin(authUser).then(adminRef => {
          // if admin
          if(authUser) {
            authUser.role = adminRef.exists? 'admin': authUser.role;
            authUser.adminProjects = [];
            if(adminRef.exists) {
              getAdminProjects(authUser).then(res => {
                authUser.adminProjects = res;
                getUserInfoAndUpdateData(authUser, dispatch, unsubscribe, resolve);
              })
            }else {
              getUserInfoAndUpdateData(authUser, dispatch, unsubscribe, resolve);
            }
          }else {
            getUserInfoAndUpdateData(authUser, dispatch, unsubscribe, resolve);
          }
        })
      },
      error => reject(error)
    );
  });
}

function getUserInfoAndUpdateData(authUser, dispatch, unsubscribe, resolve) {
  getUserInfo(authUser).then(userInfo => {
    if (userInfo && userInfo.exists) {
      const userInfoData = userInfo.data();
      authUser.isEmailConfigured = userInfoData.isEmailConfigured;
      authUser.didntBuy = userInfoData.didntBuy; // Did a person forgot / didnt buy his ticket
      authUser.updatedEmail = userInfoData.email;
      authUser.defaultProject = userInfoData.defaultProject;

      dispatch(authActions.initAuth(authUser));
      unsubscribe();
      resolve();
    } else {
      const project = getCookie('project');
      if(authUser && authUser.uid && project) {
        authUser.project = project;
      }
      // Only update the fields if no user data exists
      updateUserData(authUser).then(authUserResult => {
        dispatch(authActions.initAuth(authUserResult));
        unsubscribe();
        resolve();
      });
    }
  });
}

// TODO: perhaps should be in a better place and check if operation success
export function updateUserData(authUser) {
  return new Promise((resolve, reject) => {
    if (!authUser || !authUser.uid) {
      return resolve(null);
    }

    const userDoc = firebaseDb.collection('users').doc(authUser.uid);
    userDoc.get().then(userSnapshot => {
      if (!userSnapshot.exists) {
        // Create it for the first time
        let userSeed = {
          name: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL,
          created: new Date(),
          language: 'he' //Hebrew is default lang
        };

        if (authUser.defaultProject) {
          userSeed.defaultProject = authUser.defaultProject;
        }

        userDoc.set(userSeed);
        resolve(authUser);
      } else {
        // For existing users check if we set the isEmailConfigured flag. We use it to allow users on first time to
        // set their emails

        // Only if the given object state we should update the email then we do so
        if (authUser.isEmailConfigured) {
          // Update user details
          userDoc.set({
            name: authUser.displayName,
            email: authUser.email,
            isEmailConfigured: true,
            updated: new Date(),
            language: 'he' // Hebrew is default lang
          }, {merge: true})
        }else {
          // Simply update the user fields
          // Add any fields below
          const newUserData = { updated: new Date()};
          if (authUser.language) {
            newUserData.language = authUser.language
          }
          if (authUser.email) {
            newUserData.email = authUser.email
          }
          userDoc.set(newUserData,
            {merge: true})
        }
        resolve(authUser);
      }
    })
  })
}

// TODO - instead of await that waits for all users
// We should load the interface and then make another call - for faster loading
function getIsAdmin(authUser) {
  if(!authUser) {
    return new Promise( (resolve, reject) => {
      resolve('guest');
    })
  }
  return firebaseDb.collection('admins').doc(authUser.uid).get();
}

function getAdminProjects(authUser) {
  return new Promise( (resolve, reject) => {
    firebaseDb.collection('admins').doc(authUser.uid).collection('projects').onSnapshot(snapshot => {
      let projects = [];
      snapshot.docs.forEach(doc => {
        projects.push(doc.id);
      });
      resolve(projects);
    })
  })
}

// TODO - instead of await that waits for all users
// We should load the interface and then make another call - for faster loading
function getUserInfo(authUser) {
  if(!authUser) {
    return new Promise( (resolve, reject) => {
      resolve(null);
    })
  }
  return firebaseDb.collection('users').doc(authUser.uid).get();
}
