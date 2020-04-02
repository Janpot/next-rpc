import { hasContext } from './api/withContext';
import { Component } from 'react';

export default class Page extends Component {
  static async getInitialProps(ctx) {
    return {
      hasContext: await hasContext(ctx),
    };
  }

  render() {
    return this.props.hasContext ? <div id="has-context" /> : null;
  }
}
