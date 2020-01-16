class Node {
  constructor(value, lookup) {
    this.value = value;
    this.lookup = lookup;
  }

  get children() {
    return this.value.children.map(child => this.lookup[child]);
  }

  decorateChildren() {
    this.children.forEach(child => {
      child.parent = this;
      child.decorateChildren();
    });
  }

  get label() {
    return this.value.label.name;
  }

  get timings() {
    // { total (ns), self (ns) }
    return this.value.stats.time;
  }

  asFlameGraph() {
    // {
    //   name: "",
    //   value: 0,
    //   children?: []
    // }
    const datum = {
      name: `${this.label} (${(this.timings.total / 1000000).toFixed(3)})`,
      value: this.timings.total / 1000000
    };
    if (this.children.length) {
      datum.children = this.children.map(child => child.asFlameGraph());
    }
    return datum;
  }
}

export default class Tree {
  constructor(data) {
    const lookup = {};
    data.nodes.forEach(node => {
      nodeLookup[node.id] = new Node(node, lookup);
    });

    // Root node is the node with the lowest ID
    this.root = nodeLookup[data.nodes.sort((a, b) => a.id - b.id)[0].id];

    // Link all nodes to their parents
    this.root.decorateChildren();
  }

  // Breadth-first search by label
  find(label) {
    let queue = [this.root];
    while (queue.length) {
      let node = queue.shift();
      if (node.label === label) return node;
      queue.push(...node.children);
    }
    return null;
  }
}
