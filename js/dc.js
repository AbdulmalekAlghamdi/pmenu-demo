// Tiny runtime for the Pmenu screens: {{holes}}, loops, conditionals, events and child components.
(function () {
  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  const WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  const H = {};
  const defs = {};
  let nextId = 0;

  function get(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
  }
  const interp = (str, scope) => str.replace(HOLE, (_, p) => { const v = get(scope, p); return v == null ? '' : String(v); });
  const whole = (str) => { const m = str.match(WHOLE); return m ? m[1] : null; };

  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(p) { Object.assign(this.state, typeof p === 'function' ? p(this.state) : p); if (this.__inst) this.__inst.schedule(); }
    forceUpdate() { if (this.__inst) this.__inst.schedule(); }
  }

  function append(parent, n, scope, ctx) {
    if (n.nodeType === 3) { parent.appendChild(document.createTextNode(interp(n.nodeValue, scope))); return; }
    if (n.nodeType !== 1) return;
    if (n.tagName === 'TEMPLATE' && n.hasAttribute('data-for')) {
      const list = get(scope, whole(n.getAttribute('data-for'))) || [];
      const as = n.getAttribute('data-as');
      list.forEach((item, i) => {
        const s = Object.create(scope); s[as] = item; s.$index = i;
        n.content.childNodes.forEach((c) => append(parent, c, s, ctx));
      });
      return;
    }
    if (n.tagName === 'TEMPLATE' && n.hasAttribute('data-if')) {
      if (get(scope, whole(n.getAttribute('data-if')))) n.content.childNodes.forEach((c) => append(parent, c, scope, ctx));
      return;
    }
    const el = n.cloneNode(false);
    for (const a of Array.from(n.attributes)) {
      const w = whole(a.value);
      if (a.name.startsWith('on') && w) {
        el.removeAttribute(a.name);
        const fn = get(scope, w);
        if (typeof fn === 'function') {
          const id = ctx.inst.id + ':' + (ctx.h++);
          H[id] = fn;
          el.setAttribute('data-h-' + a.name.slice(2), id);
        }
      } else if (a.value.indexOf('{{') !== -1) {
        el.setAttribute(a.name, w ? String(get(scope, w) ?? '') : interp(a.value, scope));
      }
    }
    n.childNodes.forEach((c) => append(el, c, scope, ctx));
    parent.appendChild(el);
  }

  class Inst {
    constructor(name, props, root) {
      const d = defs[name];
      this.id = 'i' + (nextId++);
      this.tpl = d.tpl;
      this.root = root;
      this.c = new d.cls(props);
      this.c.__inst = this;
      this.render();
      if (this.c.componentDidMount) this.c.componentDidMount();
    }
    schedule() {
      if (this.pending) return;
      this.pending = true;
      queueMicrotask(() => { this.pending = false; this.render(); });
    }
    render() {
      const ctx = { inst: this, h: 0 };
      const tmp = document.createElement('div');
      const scope = this.c.renderVals() || {};
      this.tpl.content.childNodes.forEach((c) => append(tmp, c, scope, ctx));
      if (!this.mounted) {
        this.root.replaceChildren(...tmp.childNodes);
        this.mounted = true;
      } else {
        morphdom(this.root, tmp, {
          childrenOnly: true,
          onBeforeElUpdated: (from) => !(from.__dcMounted),
        });
      }
      this.root.querySelectorAll('[data-import]').forEach((el) => {
        if (el.__dcMounted) return;
        el.__dcMounted = true;
        new Inst(el.getAttribute('data-import'), JSON.parse(el.getAttribute('data-props') || '{}'), el);
      });
    }
  }

  function fire(type, e) {
    const el = e.target.closest && e.target.closest('[data-h-' + type + ']');
    if (!el) return;
    const fn = H[el.getAttribute('data-h-' + type)];
    if (fn) fn(e);
  }
  document.addEventListener('click', (e) => fire('click', e));
  document.addEventListener('input', (e) => fire('change', e));
  document.addEventListener('change', (e) => {
    if (e.target.matches('select, input[type=checkbox], input[type=radio]')) fire('change', e);
  });

  window.DCLogic = DCLogic;
  window.DC = {
    define(name, tpl, cls) { defs[name] = { tpl, cls }; },
    mount(name, root) { return new Inst(name, {}, root); },
  };
})();
