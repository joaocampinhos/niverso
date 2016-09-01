let routes = {
  'm-search': { },
  checkout: { },
  copy: { },
  delete: { },
  get: { },
  head: { },
  lock: { },
  merge: { },
  mkactivity: { },
  mkcol: { },
  move: { },
  notify: { },
  options: { },
  patch: { },
  post: { },
  purge: { },
  put: { },
  report: { },
  search: { },
  subscribe: { },
  trace: { },
  unlock: { },
  unsubscribe: { },
};

let relation;

function addRoute(v, r, f, m) {
  if (!(r in routes[m])) routes[m][r] = { };
  routes[m][r][v] = f;
}

exports.use = (r) => {
  relation = r;
};

let deprecate = (req, res) => res.status(404).json({ error: 'Resource deprecated in this version' });
exports.deprecate = deprecate;

exports['delete']   = (v, r, f) => addRoute(v, r, f, 'delete');
exports['m-search'] = (v, r, f) => addRoute(v, r, f, 'm-search');
exports.checkout    = (v, r, f) => addRoute(v, r, f, 'checkout');
exports.copy        = (v, r, f) => addRoute(v, r, f, 'copy');
exports.get         = (v, r, f) => addRoute(v, r, f, 'get');
exports.head        = (v, r, f) => addRoute(v, r, f, 'head');
exports.lock        = (v, r, f) => addRoute(v, r, f, 'lock');
exports.merge       = (v, r, f) => addRoute(v, r, f, 'merge');
exports.mkactivity  = (v, r, f) => addRoute(v, r, f, 'mkactivty');
exports.mkcol       = (v, r, f) => addRoute(v, r, f, 'mkcol');
exports.move        = (v, r, f) => addRoute(v, r, f, 'move');
exports.notify      = (v, r, f) => addRoute(v, r, f, 'notify');
exports.options     = (v, r, f) => addRoute(v, r, f, 'options');
exports.patch       = (v, r, f) => addRoute(v, r, f, 'patch');
exports.post        = (v, r, f) => addRoute(v, r, f, 'post');
exports.purge       = (v, r, f) => addRoute(v, r, f, 'purge');
exports.put         = (v, r, f) => addRoute(v, r, f, 'put');
exports.report      = (v, r, f) => addRoute(v, r, f, 'report');
exports.search      = (v, r, f) => addRoute(v, r, f, 'search');
exports.subscribe   = (v, r, f) => addRoute(v, r, f, 'subscribe');
exports.trace       = (v, r, f) => addRoute(v, r, f, 'trace');
exports.unlock      = (v, r, f) => addRoute(v, r, f, 'unlock');
exports.unsubscribe = (v, r, f) => addRoute(v, r, f, 'ubsubscribe');

exports.start = (app) => {
  for (let m in routes) {
    for (let key in routes[m]) {
      app[m](key, (req, res) => {
        let v = req.get('X-Version') || relation.root;
        let m = req.get('X-Mode')    || 0;
        if (v[0] === '@') {
          // exact version
          const _v = v.substring(1);
          if (!relation.isVersion(_v)) return res.status(400).json({ error: 'Invalid version provided' });
          const node = routes[m][key][_v];
          if (node) {
            res.set('X-Version', _v);
            return res.json(node(req, res));
          }
        } else {
          // dinamic version
          if (!relation.isVersion(v)) return res.status(400).json({ error: 'Invalid version provided' });

          // find version > v
          let possible_relations = [];
          for (let f in routes[m][key]) {
            if (isC(v, f, m)) possible_relations.push(f);
          }
          if (possible_relations.length) {
            const updated_version = bigR(possible_relations);
            if (updated_version) {
              console.log(updated_version);
              const node = routes[m][key][updated_version];
              res.set('X-Version', updated_version);
              return res.json(node(req, res));
            }
          }

          // find version = v
          const node = routes[m][key][v];
          if (node) {
            res.set('X-Version', v);
            return res.json(node(req, res));
          }

          // find version < v
          const path = relation.pathToRoot(v).reverse();
          let i = path.length;
          while (i--) {
            const node = routes[m][key][path[i]];
            if (node) {
                res.set('X-Version', path[i]);
                return res.json(node(req, res));
            }
          }
        }
        return res.status(400).json({ error: 'Could not find any valid version' });
      });
    }
  }
};

function isC(v1, v2, mode) {
  console.log(mode);
  const v1l = relation.pathToRoot(v1);
  const v2l = relation.pathToRoot(v2);
  const v2t = relation.typeToRoot(v2);
  if (v1l.length >= v2l.length) return false;
  const idx = v2l.findIndex((el) => el == v1);
  let big = 0;
  if (idx == -1) return false;
  for (let i = 0; i < idx; i++) {
    if (v2t[i] > big) big = v2t[i];
  }
  if (big >= mode) return false;
  return true;
}

function bigR(r) {
  return r
    .map((el) => [el, relation.pathToRoot(el).length])
    .reduce((p, c) => p[1] > c[1] ? p : c)[0];
};
