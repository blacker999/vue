
class Vue {
  constructor(options) {
    this.$el = document.querySelector(options.el);
    this.$methods = options.methods;
    this._binding = {};
    this._observer(options.data);
    this._compile(this.$el);
  }
  _pushWatcher(watcher) {
    if (!this._binding[watcher.key]) {
      this._binding[watcher.key] = [];
    }
    this._binding[watcher.key].push(watcher);
  }
  /*
   observer的作用是能够对所有的数据进行监听操作，通过使用Proxy对象
   中的set方法来监听，如有发生变动就会拿到最新值通知订阅者。
  */
  _observer(datas) {
    const me = this;
    const handler = {
      set(target, key, value) {
        const rets = Reflect.set(target, key, value);
        me._binding[key].map(item => {
          item.update();
        });
        return rets;
      }
    };
    this.$data = new Proxy(datas, handler);
  }
  /*
   指令解析器，对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，以及绑定相对应的更新函数
  */
  _compile(root) {
    const nodes = Array.prototype.slice.call(root.children);
    const data = this.$data;
    nodes.map(node => {
      if (node.children && node.children.length) {
        this._compile(node.children);
      }
      const $input = node.tagName.toLocaleUpperCase() === "INPUT";
      const $textarea = node.tagName.toLocaleUpperCase() === "TEXTAREA";
      const $vmodel = node.hasAttribute('v-model');
      // 如果是input框 或 textarea 的话，并且带有 v-model 属性的
      if (($vmodel && $input) || ($vmodel && $textarea)) {
        const key = node.getAttribute('v-model');
        this._pushWatcher(new Watcher(node, 'value', data, key));
        node.addEventListener('input', () => {
          data[key] = node.value;
        });
      }
      if (node.hasAttribute('v-bind')) {
        const key = node.getAttribute('v-bind');
        this._pushWatcher(new Watcher(node, 'innerHTML', data, key));
      }
      if (node.hasAttribute('@click')) {
        const methodName = node.getAttribute('@click');
        const method = this.$methods[methodName].bind(data);
        node.addEventListener('click', method);
      }
    });
  }
}
/*
 watcher的作用是 链接Observer 和 Compile的桥梁，能够订阅并收到每个属性变动的通知，
 执行指令绑定的响应的回调函数，从而更新视图。
*/
class Watcher {
  constructor(node, attr, data, key) {
    this.node = node;
    this.attr = attr;
    this.data = data;
    this.key = key;
  }
  update() {
    this.node[this.attr] = this.data[this.key];
  }
}