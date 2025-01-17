import React from 'react';
import {
  SCREEN_INTRODUCTION,
  SCREEN_REGISTER_METHOD,
  SCREEN_CHOOSE_METHOD,
  SCREEN_COMPLETE,
} from '../Register';
import { connect } from 'react-redux';

const fallbacks = require('../../../lang/src/en.json');

const Title = ({ screen, method, Tag = 'h2', className = 'mfa-section-title' }) => {
  const { ss: { i18n } } = window;
  let content;

  switch (screen) {
    case SCREEN_INTRODUCTION:
      content = i18n._t(
        'MultiFactorAuthentication.TITLE',
        fallbacks['MultiFactorAuthentication.TITLE']
      );
      break;
    case SCREEN_CHOOSE_METHOD:
      content = i18n._t(
        'MultiFactorAuthentication.SELECT_METHOD',
        fallbacks['MultiFactorAuthentication.SELECT_METHOD']
      );
      break;
    case SCREEN_COMPLETE:
      content = i18n._t(
        'MultiFactorAuthentication.SETUP_COMPLETE_TITLE',
        fallbacks['MultiFactorAuthentication.SETUP_COMPLETE_TITLE']
      );
      break;
    case SCREEN_REGISTER_METHOD:
      content = method && method.name;
      break;
    default:
      content = false;
  }

  if (!content || !content.length) {
    return null;
  }

  const ParsedTag = Tag || 'span';

  return <ParsedTag className={className}>{ content }</ParsedTag>;
};

export { Title as Component };

const mapStateToProps = state => {
  const source = state.mfaRegister || state;

  return {
    screen: source.screen,
    method: source.method,
  };
};

export default connect(mapStateToProps)(Title);
