import {getLogger} from 'aurelia-logging';
import {inject} from 'aurelia-dependency-injection';
import {Firebase} from './firebase';

@inject(Firebase)
export class AuthenticationService {
  firebase;
  logger;

  constructor(firebase) {
    this.logger = getLogger('AuthenticationService');
    this.firebase = firebase;
  }

  get interceptor() {
    return request => {
      if (request instanceof Request) {
        return this.getToken().then(token => {
          let [path, ...params] = request.url.split('?');
          let url = `${path}.json?auth=${[token, params.join('?')].join('&')}`;
          let init = {};
          ['method', 'headers', 'body', 'mode', 'credentials',
            'cache', 'redirect', 'referrer', 'integrity']
              .forEach(prop => init[prop] = request[prop]);
          return new Request(url, init);
        });
      }
      return Promise.resolve(request);
    };
  }

  getToken() {
    let currentUser = this.firebase.native.auth().currentUser;
    return currentUser ? currentUser.getToken() : Promise.resolve();
  }

  isLoggedIn() {
    return !!this.firebase.native.auth().currentUser;
  }

  login(email, password) {
    this.logger.debug('trying to login...');
    return this.firebase.native.auth().signInWithEmailAndPassword(email, password)
      .then(() => {
        this.logger.debug('user logged in successfully');
      })
      .catch(err => {
        let msg = 'authentication failed';
        this.logger.error(err);
        throw new Error(msg);
      });
  }

  logout() {
    return this.firebase.native.auth().signOut()
      .then(() => this.logger.debug('user logged out successfully'));
  }
}
