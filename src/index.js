import 'babel/polyfill';
import GHPromiser from './gh-promiser';
import atob from './atob';

export function load(opts) {
  return GHPromiser(opts.token).contents(opts).then(({ content }) => atob(content));
}

export function save(opts) {
  const github = GHPromiser(opts.token);
  const origin = opts.owner + '/' + opts.repo;
  opts = { ...defaultOpts, ...opts };

  return Promise
    .all([getUsersRepos(github), getRepoForks(github, opts)])
    .then(findFork(origin))
    .then(forkIfNotFound(github, opts))
    .then(createForkOpts(opts))
    .then(ensureBranch(github, opts))
    .then(write(github, opts))
    .then(pullRequest(github, opts));
}

const defaultOpts = {
  title: 'Wikihub Changes',
  body: 'Automatically generated by wikihub',
  forkBranch: 'wikihub',
  message: 'Wikihub changes...'
}

const returns = value => () => value;
const firstInBoth = (a, b) => a.find(x => b.includes(x));
const parseRepo = repo => repo.full_name;
const parseRepos = repos => repos.map(parseRepo);
const parsePulls = pulls => pulls.map(pull => pull.head.label);
const getUsersRepos = github => github.repos().then(parseRepos);
const getRepoForks = (github, opts) => github.forks(opts).then(parseRepos);
const findFork = origin => ([repos, forks]) => firstInBoth([origin, ...forks], repos);
const forkIfNotFound = (github, opts) => name => name || github.fork(opts).then(parseRepo);
const write = (github, opts) => fork => github.write(fork).then(returns(fork));

function createForkOpts(opts) {
  return forkName => {
    const [owner, repo] = forkName.split('/')
    return { ...opts, owner, repo, branch: opts.forkBranch };
  }
}

function ensureBranch(github, opts) {
  return fork => {
    const branchOpts = { ...fork, oldBranch: opts.branch, newBranch: fork.branch };

    return github
      .listBranches(fork)
      .then(branches => branches.includes(fork.branch) || github.branch(branchOpts))
      .then(returns(fork));
  };
}

function pullRequest(github, opts) {
  return fork => {
    const head = fork.owner + ':' + fork.branch;

    return github
      .listPulls(opts)
      .then(parsePulls)
      .then(pulls => pulls.includes(head) ? null : github.pullRequest({ ...opts, head }));
  };
}