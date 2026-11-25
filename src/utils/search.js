
// Utility functions for searching cards by keyword or notes using a binary search tree

// Node class for the binary search tree
class Node {
  constructor(key, card) {
    this.key = key.toLowerCase();
    this.card = card;
    this.left = null;
    this.right = null;
  }
}

// Binary Search Tree implementation for searching cards by keyword or notes
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


  // Search for a card by keyword or notes; returns the first matching card found
  search(query) {
    const q = query.toLowerCase();
    return this._search(this.root, q);
  }

  _search(node, q) {
    if (!node) return null;
    if (node.key.includes(q) || q.includes(node.key)) return node.card;
    if (q < node.key) return this._search(node.left, q);
    return this._search(node.right, q);
  }
}

// Build a binary search tree from an array of cards, indexing by keyword and notes
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
