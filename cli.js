#!/usr/bin/env node
const errs = require('errs');
const getStdin = require('get-stdin');
const CheckersClient = require('./index');

/**
 * Initialize a Checkers client given the parsed argv
 *
 * @param {object} argv The parsed args
 * @private
 */
function initClient(argv) {
  if (!argv.url) {
    throw 'Missing URL argument. Pass via -u or in env as CHECKERS_URL.';
  }
  if (!argv.client_key) {
    throw 'Missing client_key argument. Pass via -k or in env as CHECKERS_CLIENT_KEY.';
  }
  if (!argv.client_secret) {
    throw 'Missing client_secret argument. Pass via -s or in env as CHECKERS_CLIENT_SECRET.';
  }

  return new CheckersClient({
    url: argv.url,
    clientKey: argv.client_key,
    clientSecret: argv.client_secret
  });
}

require('yargs')
  .env('CHECKERS')
  .options({
    url: {
      alias: 'u',
      describe: 'URL for the Checkers server',
      type: 'string'
    },
    client_key: {
      alias: 'k',
      describe: 'Client access key',
      type: 'string'
    },
    client_secret: {
      alias: 's',
      describe: 'Client access secret',
      type: 'string'
    }
  })
  .command('create', 'Create a Check on a given org/repo/sha. Pass payload via stdin.', {
    name: {
      alias: 'n',
      describe: 'The name of the Check',
      type: 'string',
      demandOption: true
    },
    owner: {
      alias: ['o', 'org'],
      describe: 'The name of the owner/org for the repository on which you would like to create the Check',
      type: 'string',
      demandOption: true
    },
    repo: {
      alias: ['r', 'repository'],
      describe: 'The name of the repository on which you would like to create the Check',
      type: 'string',
      demandOption: true
    },
    sha: {
      alias: 'h',
      describe: 'The SHA of the commit for which you would like to create the Check',
      type: 'string',
      demandOption: true
    }
  }, async argv => {
    const checkers = initClient(argv);
    console.log(argv); return;
    const res = await checkers.createCheckRun({
      owner: argv.owner,
      repo: argv.repo,
      sha: argv.sha,
      checkName: argv.name,
      payload: await getStdin()
    });
    if (res.statusCode < 200 || res.statusCode > 299) {
      throw errs.create({
        message: 'Checkers request failed.',
        statusCode: res.statusCode,
        body: res.body
      });
    }
  })
  .command('update', 'Update an existing Check. Pass payload via stdin.', {
    owner: {
      alias: ['o', 'org'],
      describe: 'The name of the owner/org for the repository on which you would like to create the Check',
      type: 'string',
      demandOption: true
    },
    repo: {
      alias: ['r', 'repository'],
      describe: 'The name of the repository on which you would like to create the Check',
      type: 'string',
      demandOption: true
    },
    id: {
      alias: ['i', 'checkId'],
      describe: 'The identifier of the existing check run',
      type: 'number',
      demandOption: true
    }
  }, async argv => {
    const checkers = initClient(argv);
    const res = await checkers.updateCheckRun({
      owner: argv.owner,
      repo: argv.repo,
      checkRunId: argv.id,
      payload: await getStdin()
    });
    if (res.statusCode < 200 || res.statusCode > 299) {
      throw errs.create({
        message: 'Checkers request failed.',
        statusCode: res.statusCode,
        body: res.body
      });
    }
  })
  .demandCommand(1, 1, 'You must specify a command', 'You may only specify one command')
  .example('make_payload.sh | $0 create -n MyCheck -o SomeOrg -r SomeRepo -s 1234567',
    'Produce your Check payload and pass it in via stdin.')
  .help()
  .argv;
