import React, { Component } from 'react';
import { ReactDom } from 'react-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { getAuth } from 'src/auth';
import ReactTooltip from 'react-tooltip'

import { getCommentList } from 'src/comments';

import './task-view.css';
import Icon from '../icon';
import Textarea from 'react-textarea-autosize';

import Img from 'react-image'
import TagsInput from 'react-tagsinput';
import 'react-tagsinput/react-tagsinput.css';
import Select from 'react-select';
import Button from '../button';
import CommentList from '../comment-list';
import TagsSuggestions from '../tags-suggestions';
import AddComment from '../add-comment/add-comment';
import TaskViewHeader from '../task-view-header/task-view-header';
import { I18n } from 'react-i18next';
import i18n from '../../../i18n.js';
import { appConfig } from 'src/config/app-config'

export class TaskView extends Component {
  constructor() {
    super(...arguments);

    this.state = {
      title: '',
      description: '',
      projectName: null,
      defaultProjectNames: [
        //TODO : add projects
      ],
      type: '',
      defaultType: [
        { value: 1, label: i18n.t('task.types.planning')},
        { value: 2, label: i18n.t('task.types.shifts')},
        { value: 3, label: i18n.t('task.types.camps')},
        { value: 4, label: i18n.t('task.types.art')},
        { value: 5, label: i18n.t('task.types.other')}
      ],
      label: [],
      isCritical: false
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleLabelChange = this.handleLabelChange.bind(this);
    this.handleAddLabel = this.handleAddLabel.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  static propTypes = {
    selectTask: PropTypes.func.isRequired,
    updateTask: PropTypes.func.isRequired,
    removeTask: PropTypes.func.isRequired,
    assignTask: PropTypes.func.isRequired,
    unassignTask: PropTypes.func.isRequired,
    selectedTask: PropTypes.object,
    isAdmin: PropTypes.bool.isRequired,
    isGuide: PropTypes.bool.isRequired,
    unloadComments: PropTypes.func.isRequired
  };

  componentWillMount() {
    this.updateStateByProps(this.props);
  }

  updateStateByProps(props) {
    let nextSelectedTask = props.selectedTask || {};
    let { id, title, description, type, projectName,
      label, isCritical, dueDate, createdDate,
    } = nextSelectedTask;

      // this checks if we got another task, or we're updating the same one
      if (id != this.state.id) {
        const labelAsArray = label ?
          (Object.keys(label).map( l => { return l })) : [];

        this.setState({
          id: id || '',
          title: title || '',
          description:description || '',
          label: labelAsArray || [],
          isCritical: isCritical || false,
          createdDate: createdDate || '',
          dueDate: dueDate || null,
          type: type || '',
          projectName: projectName || ''
        });
      }
  }

  componentWillReceiveProps(nextProps) {
    // TODO - check this maybe called several times now that we use comments
    this.updateStateByProps(nextProps);
  }

  render() {
    const task = this.props.selectedTask;
    if(!task) {
      return(
        <div className="task-view g-row">
          <div className="g-col">
            <h1>&nbsp;</h1>
          </div>
        </div>
      );
    }

    const isUserCreator = task.creator && task.creator.id == this.props.auth.id;
    const isUserAssignee = task.assignee && task.assignee.id == this.props.auth.id;
    const canEditTask = isUserCreator || isUserAssignee || this.props.isAdmin;
    const canDeleteTask = isUserCreator || this.props.isAdmin;
    const showUnassignButton = this.props.isAdmin || (this.props.isGuide && isUserCreator)

    return (
      <I18n ns='translations'>
      {
      (t, { i18n }) => (
        <div className='task-view-container' dir={t('lang-dir')}>
          <TaskViewHeader
          task={ this.props.selectedTask }
          canDeleteTask={ canDeleteTask }
          selectTask={ this.props.selectTask }
          assignTask={ this.props.assignTask }
          unassignTask={ this.props.unassignTask }
          removeTask={ this.props.removeTask }
          showUnassignButton = { showUnassignButton }
          />
          <div className='task-view'>
            <form onSubmit={this.handleSubmit} noValidate>
              {this.renderInput(task, 'title', t('task.name'), canEditTask)}
              {this.renderTextArea(task, 'description', t('task.description'), canEditTask)}
              <div className='instruction'><span>{t('task.type')}</span></div>
              { this.renderSelect(task, 'type', t('task.type'), this.state.defaultType, canEditTask, t)}
              <div className='instruction'><span>{t('task.automatic-tags')}</span></div>
              <div>
                <TagsSuggestions
                  tags={appConfig.popularTags}
                  onTagSelected={(tag) => {
                    this.handleAddLabel(tag);
                    this.updateStateByProps(this.props); //TODO - maybe add bugs
                  }}
                />
              </div>
              <div><Icon className='label' name='loyalty' /> {this.renderLabel(canEditTask, t)} </div>
              <div className='is-critical'>{ this.renderCheckbox(task, 'isCritical', t('task.is-critical'), canEditTask) }</div>
              {this.renderTaskCreator(t, task) }
            </form>
            <span>{t('comments.title')}</span>
            { this.props.comments ?
            <CommentList
            task={task}
            comments={this.props.comments}
            auth={this.props.auth} /> : ''}
          </div>
          { this.renderAddComment() }
        </div>
      )}
      </I18n>
    );
  }

  renderTaskCreator(t, task) {
    if (!task.creator) return;
    const avatar = task.creator.photoURL ? <Img className='avatar' src={task.creator.photoURL} alt={task.creator.name}/> : '';
      return (
        <div>
          <span>{t('task.creator')}</span>
          <span className='avatar-creator' data-tip={task.creator.name}>
            <ReactTooltip type='light' effect='solid'/>
            { avatar }
          </span>
        </div>
      );
  }

  renderAddComment() {
    return (
      <AddComment
      task={ this.props.selectedTask }
      createComment={this.props.createComment }
      auth={this.props.auth}
      key='addComment' />)
  }

  renderSelect(task, fieldName, placeholder, options, isEditable, translation) {
    return (
      <Select
      type='text'
      name={fieldName}
      value={this.state[fieldName]}
      placeholder={placeholder}
      ref={e => this[fieldName+'Input'] = e}
      onChange={(e) => { let val=null; if (e) { val = e.value };
                this.setState({ [fieldName]: val}) }}
      options={options}
      onBlur={this.handleSubmit}
      noResultsText={translation('general.no-results-found')}
      searchable={ false }
      disabled = { !isEditable }/>
  );
  }

  renderInput(task, fieldName, placeholder, isEditable) {
    const classNames = isEditable ? ' editable' : ''
    return (
        <input
        className={`changing-input${classNames}`}
        type = 'text'
        name = { fieldName }
        value = { this.state[fieldName] }
        placeholder = { placeholder }
        ref = { e => this[fieldName+'Input'] = e }
        onChange = { this.handleChange }
        onBlur = { this.handleSubmit }
        disabled = { !isEditable } />
    );
  }

  renderTextArea(task, fieldName, placeholder, isEditable) {
    const classNames = isEditable ? ' editable' : ''
    return (
        <Textarea
        className={`changing-input${classNames}`}
        name={fieldName}
        value={this.state[fieldName]}
        placeholder={placeholder}
        ref={e => this[fieldName+'Input'] = e}
        onChange={this.handleChange}
        onBlur={this.handleSubmit}
        disabled = { !isEditable } />
    );
  }

  renderLabel(isEditable, translation) {
    const showPlaceholder = true;
    const classNames = isEditable ? ' editable' : ''
    return (
      <TagsInput className={`react-tagsinput-changing${classNames}`}
      value={this.state.label}
      onChange={this.handleLabelChange}
      onlyUnique={true}
      addOnBlur={true}
      inputProps={{ placeholder: showPlaceholder ? translation('task.input-tags') : ''}}
      disabled = { !isEditable }
      />
    )
  }

  renderCheckbox(task, fieldName, placeholder, isEditable) {
    const classNames = isEditable ? ' editable' : ''
    return (
      <label>
        <input
        type = 'checkbox'
        checked = { this.state[fieldName] }
        value = { placeholder }
        onChange={e => { this.setState({ [fieldName]: !this.state[fieldName]}) }}
        disabled = { !isEditable }
        onBlur={this.handleSubmit}
        />
        { placeholder }
      </label>
    );
  }

  handleChange(e) {
    let fieldName = e.target.name;
    this.setState({
      [fieldName]: e.target.value
    });
  }

  handleAddLabel(label) {
    var newLabels = this.state.label
    newLabels.push(label)
    this.handleLabelChange(newLabels)
  }

  handleLabelChange(label) {
    this.setState({label})
    this.handleSubmit() // TODO: might not be good as we want to have initially a save button
  }

  handleKeyUp(event) {
    if (event.keyCode === 13) {
      this.handleSubmit(event);
    }
  }

  handleSubmit(event) {
    if(event) {
      event.preventDefault();
    }
    let labelAsObject = this.arrayToObject(this.state.label);
    const fieldsToUpdate = {
      title: this.state.title,
      description: this.state.description,
      label: labelAsObject,
      isCritical: this.state.isCritical,
      type: this.state.type,
      projectName: this.state.projectName
    };
    fieldsToUpdate.dueDate = this.state.dueDate || null;

    this.props.updateTask(this.props.selectedTask, fieldsToUpdate);
  }

  arrayToObject(array) {
    var result = {};
    for (var i = 0; i < array.length; ++i)
      result[array[i]] = true;
    return result;
  }
}

//=====================================
//  CONNECT
//-------------------------------------

const mapStateToProps = createSelector(
  getCommentList,
  getAuth,
  (comments, auth) => ({
    comments,
    auth
  })
);

const mapDispatchToProps = Object.assign(
  {},
);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskView);
