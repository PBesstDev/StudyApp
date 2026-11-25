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
    const newNode = new Node(key, card);
    if (!this.root) {
      this.root = newNode;
      return;
    }
    this._insert(this.root, newNode);
  }

  _insert(node, newNode) {
    if (newNode.key < node.key) {
      if (!node.left) node.left = newNode;
      else this._insert(node.left, newNode);
    } else {
      if (!node.right) node.right = newNode;
      else this._insert(node.right, newNode);
    }
  }

  searchAll(query) {
    const q = query.toLowerCase();
    const results = [];
    this._searchAll(this.root, q, results);
    // Deduplicate by keyword+notes
    const seen = new Set();
    return results.filter(card => {
      const key = `${card.keyword}|${card.notes}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  _searchAll(node, q, results) {
    if (!node) return;
    if (node.key.includes(q) || q.includes(node.key)) {
      results.push(node.card);
    }
    this._searchAll(node.left, q, results);
    this._searchAll(node.right, q, results);
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
