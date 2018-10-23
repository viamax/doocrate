import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Button from '../button';
import MyProfileTooltip from '../my-profile-tooltip';
import { ToastContainer } from 'react-toastify';
import { I18n } from 'react-i18next';
import { appConfig } from 'src/config/app-config'
import { Redirect, Switch} from 'react-router-dom'

import 'react-toastify/dist/ReactToastify.min.css'

import './header.css';
import GoogleTranslate from '../google-translate/google-translate';

const menuContent =
  `<div>
    <Img className='avatar' src={auth.photoURL} alt={auth.name}/>
     <Button onClick={signOut}>{t('header.disconnect')}</Button>
  </div>`;

class Header extends Component {
  static propTypes = {
    auth: PropTypes.object.isRequired,
    signOut: PropTypes.func.isRequired,
    isShowUpdateProfile: PropTypes.func.isRequired,
    onShowSuccess: PropTypes.func.isRequired,
  };

  constructor() {
    super(...arguments);

    this.state = {
      redirectTo: null
    };

    this.renderLanguageButton = this.renderLanguageButton.bind(this);
    this.renderRedirectToCreateProject = this.renderRedirectToCreateProject.bind(this);
  }

  render() {
    return (
      <I18n ns='translations'>
        {
          (t, {i18n}) => (
            <header className='header'>
              <div className='g-row'>
                <div className='g-col'>
                  <ToastContainer
                    position='top-center'
                    autoClose={appConfig.notificationShowTime}
                    hideProgressBar={false}
                    newestOnTop={true}
                    pauseOnHover
                  />
                  <ul className='header-actions'>
                    {this.props.auth ?
                      <div>
                        <MyProfileTooltip
                          auth={this.props.auth}
                          signOut={this.props.signOut}
                          isShowUpdateProfile={this.props.isShowUpdateProfile}
                        />
                        {this.props.auth.photoURL ?
                          <div className='task-item-assignee' data-html={true} data-tip={menuContent}/>
                          : <div data-html={true} data-tip={
                            <div>
                              {t('header.me')}
                              <Button onClick={this.props.signOut}>{t('header.disconnect')}</Button>
                            </div>
                          }/>
                        }

                      </div>
                      : null
                    }
                  </ul>
                  <h1 className='header-title'><a href='/'>Doocrate</a></h1>
                  <div className={`lang-select lang-${t('lang-float-reverse')}`}>
                    {this.renderLanguageButton(t, i18n, this.props.onShowSuccess)}
                  </div>
                  <GoogleTranslate/>
                  <div className={'create-project'}>
                    <Button onClick={() => this.redirectTo('/create-project')}>{t('header.create-project')}</Button>
                    {this.renderRedirectToCreateProject()}
                  </div>
                </div>
              </div>
            </header>
          )}
      </I18n>
    );
  }

  renderRedirectToCreateProject = () => {
    if (this.state.redirectTo) {
      this.setState({redirectTo : null});
      return (
        <Switch>
          <Redirect to={this.state.redirectTo} />
        </Switch>
      )
    }
  };

  redirectTo = (url) => {
    this.setState({
      redirectTo: url
    })
  };

  static changeLanguage(changeLang, t, i18n, onShowSuccess) {
    i18n.changeLanguage(changeLang);
    onShowSuccess('To see translated tasks - press on "Select language" on the top left and choose English');
  }

  renderLanguageButton(t, i18n, onShowSuccess) {
    const changeLang = (i18n.language === 'en') ? 'he' : 'en';

    return (
      <div>
        <button
          onClick={() => {
            Header.changeLanguage(changeLang, t, i18n, onShowSuccess)
          }}>
          {t('nav.' + changeLang + '-lang')}
        </button>
      </div>
    )
  }
}

export default Header;
