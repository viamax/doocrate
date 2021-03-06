import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Route, withRouter, Switch } from 'react-router-dom';
import { I18n } from 'react-i18next';
import { compose } from 'recompose';

import { authActions, getAuth } from 'src/auth';
import { userInterfaceActions, getTour } from 'src/user-interface';
import { getProject } from 'src/projects';
import Header from '../components/header';
import BottomNavBar from '../components/bottom-nav-bar';
import RequireAuthRoute from '../components/require-auth-route';
import RequireUnauthRoute from '../components/require-unauth-route';
import SignInPage from '../pages/sign-in';
import LogoutPage from '../pages/logout';
import MagicLink from '../pages/magic-link';
import TasksPage from '../pages/tasks';
import MePage from '../pages/me';
import CreateProjectPage from '../pages/set-project';
import NotFound from '../pages/not-found/';
import AboutPage from '../pages/about';
import ReportsPage from '../pages/reports';
import ProjectsPage from '../pages/projects';
import AdminDashboard from '../pages/admin-dashboard';
import { createSelector } from 'reselect';
import 'url-search-params-polyfill';

const App = ({
  auth,
  selectedProject,
  signOut,
  createProjectRedirect,
  isShowUpdateProfile,
  tour,
  setTour,
}) => (
  <I18n ns="translations">
    {(t, { i18n }) => (
      <div dir={t('lang-dir')}>
        <Header
          auth={auth}
          signOut={signOut}
          createProject={createProjectRedirect}
          isShowUpdateProfile={isShowUpdateProfile}
          tour={tour}
          setTour={setTour}
          selectedProject={selectedProject}
        />

        <main>
          <Switch>
            <RequireAuthRoute
              authenticated={auth && auth.authenticated}
              exact
              path="/"
              component={ProjectsPage}
            />
            <RequireAuthRoute
              authenticated={auth && auth.authenticated}
              path="/create-project"
              component={CreateProjectPage}
            />
            <RequireUnauthRoute
              authenticated={auth && auth.authenticated}
              exact
              path="/sign-in/"
              component={SignInPage}
            />
            <RequireAuthRoute
              authenticated={auth && auth.authenticated}
              exact
              path="/logout/"
              component={LogoutPage}
            />
            <RequireUnauthRoute
              authenticated={auth && auth.authenticated}
              exact
              path="/magic-link"
              component={MagicLink}
            />
            <Route
              authenticated={auth && auth.authenticated}
              path="/projects"
              component={ProjectsPage}
            />
            <Route
              authenticated={auth && auth.authenticated}
              path="/about"
              component={AboutPage}
            />
            <RequireAuthRoute
              authenticated={
                auth && auth.authenticated && auth.role === 'admin'
              }
              exact
              path="/admin/dashboard"
              component={AdminDashboard}
            />
            {/* The hierarchy here is important - /:projectUrl/task/:id should come before /:projectUrl
             * Otherwise React router doesn't parse task id properly */}
            <RequireAuthRoute
              authenticated={auth && auth.authenticated}
              path="/:projectUrl/task/:id"
              component={TasksPage}
            />
            <RequireAuthRoute
              authenticated={auth && auth.authenticated}
              path="/:projectUrl/task/new-task"
              component={TasksPage}
            />
            <RequireAuthRoute
              authenticated={auth && auth.authenticated}
              path="/:projectUrl/edit"
              component={CreateProjectPage}
            />
            <RequireAuthRoute
              authenticated={auth && auth.authenticated}
              path="/:projectUrl/me"
              component={MePage}
            />
            <RequireAuthRoute
              authenticated={
                auth && auth.authenticated && auth.role === 'admin'
              }
              path="/:projectUrl/reports"
              component={ReportsPage}
            />
            <RequireAuthRoute
              authenticated={auth && auth.authenticated}
              path="/:projectUrl/"
              component={TasksPage}
            />
            <Route component={NotFound} />
          </Switch>
        </main>
        <BottomNavBar auth={auth} selectedProject={selectedProject} />
      </div>
    )}
  </I18n>
);

App.propTypes = {
  auth: PropTypes.object.isRequired,
  signOut: PropTypes.func.isRequired,
  isShowUpdateProfile: PropTypes.func.isRequired,
};

//=====================================
//  CONNECT
//-------------------------------------

const mapStateToProps = createSelector(
  getAuth,
  getProject,
  getTour,
  (auth, selectedProject, tour) => ({
    auth,
    selectedProject: selectedProject || {},
    tour: tour,
  }),
);

const mapDispatchToProps = {
  signOut: authActions.signOut,
  isShowUpdateProfile: authActions.isShowUpdateProfile,
  setTour: userInterfaceActions.setTour,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(App);
