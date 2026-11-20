class Node {
  constructor(key, card) {
    this.key = key.toLowerCase();
    this.card = card;
    this.left = null;
    this.right = null;
  }
}

export class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  insert(key, card) {
    if (!key) return;
    const newNode = new Node(key, card);
    if (!this.root) {
      this.root = newNode;
      return;
    }
    this._insertNode(this.root, newNode);
  }

  _insertNode(node, newNode) {
    if (newNode.key < node.key) {
      if (!node.left) node.left = newNode;
      else this._insertNode(node.left, newNode);
    } else if (newNode.key > node.key) {
      if (!node.right) node.right = newNode;
      else this._insertNode(node.right, newNode);
    }
  }

  search(query) {
    return this._search(this.root, query.toLowerCase());
  }

  _search(node, q) {
    if (!node) return null;
    if (node.key.includes(q) || q.includes(node.key)) return node.card;
    if (q < node.key) return this._search(node.left, q);
    return this._search(node.right, q);
  }
}

export function buildBST(cards) {
  const bst = new BinarySearchTree();
  cards.forEach(card => {
    if (card.keyword) bst.insert(card.keyword, card);
    if (card.notes) {
      bst.insert(card.notes, card);
      card.notes.split(/\s+/).forEach(word => {
        if (word.length > 2) bst.insert(word, card);
      });
    }
  });
  return bst;
}
