const crypto = require('crypto');
const errs = require('errs');
const request = require('request-promise-native');

/**
 * Client library for Checkers
 */
class CheckersClient {
  /**
   * Construct a Checkers client
   *
   * @param {object} opts Options
   * @param {string} opts.url URL to the Checkers service (i.e. https://checkers.myserver.com)
   * @param {string} opts.clientKey Client key for the Checkers service
   * @param {string} opts.clientSecret Client secret for the Checkers service
   * @public
   */
  constructor({ url, clientKey, clientSecret }) {
    this.url = encodeURI(url.replace(/\/+$/, ''));
    this.clientKey = clientKey;
    this.clientSecret = clientSecret;
  }

  /**
   * Create a Check run on GitHub for a given repo/SHA
   *
   * @param {object} opts Options
   * @param {string} opts.owner The owning org/user for the repo
   * @param {string} opts.repo The repo name
   * @param {string} opts.sha The SHA of the commit to post the Check to
   * @param {string} opts.checkName The name of the Check
   * @param {object} opts.payload The Check payload data
   * @async
   * @public
   */
  async createCheckRun({ owner, repo, sha, checkName, payload }) {
    const e = encodeURIComponent;
    const path = `/check/${e(checkName)}/${e(owner)}/${e(repo)}/${e(sha)}`;
    const body = JSON.stringify(payload);
    
    return this._request('POST', path, body);
  }

  /**
   * Update an existing Check run on GitHub for a given repo/SHA
   *
   * @param {object} opts Options
   * @param {string} opts.owner The owning org/user for the repo
   * @param {string} opts.repo The repo name
   * @param {number} opts.checkRunId Existing check run identifier
   * @param {object} opts.payload The Check payload data
   * @async
   * @public
   */
  async updateCheckRun({ owner, repo, checkRunId, payload }) {
    const e = encodeURIComponent;
    const path = `/check/${e(owner)}/${e(repo)}/${e(checkRunId)}`;
    const body = JSON.stringify(payload);
    
    return this._request('PATCH', path, body);
  }

  /**
   * @typedef {object} CheckersResponse
   * @prop {number} statusCode The HTTP status code received from the Checkers server
   * @prop {object} body The parsed JSON body received from the Checkers server
   * @public
   */

  /**
   * Make a signed request to the Checkers server
   *
   * @param {string} method The HTTP method to use
   * @param {string} path The path under `/api` to request
   * @param {string} body The stringified request body
   * @returns {Promise<CheckersResponse>} Response from Checkers server
   * @async
   * @private
   */
  async _request(method, path, body) {
    const url = `${this.url}/api${path}`;
    const signature = this._getRequestSignature(path, body);

    /** @type {import('request-promise-native').FullResponse} */
    const res = await request(url, {
      headers: {
        'X-Client-Key': this.clientKey,
        'X-Request-Signature': signature
      },
      body,
      method,
      json: true,
      resolveWithFullResponse: true
    });
    return {
      statusCode: res.statusCode,
      body: res.body
    }
  }

  /**
   * Get the request signature for a given request
   *
   * @param {string} path The path for the API being called (not including `/api`)
   * @param {string} body The body of the request, exactly as it will be sent
   * @returns {string} The request signature
   * @private
   */
  _getRequestSignature(path, body) {
    return crypto.createHash('sha256')
      .update(path + body.length + this.clientSecret)
      .digest('hex');
  }
}

module.exports = CheckersClient;
