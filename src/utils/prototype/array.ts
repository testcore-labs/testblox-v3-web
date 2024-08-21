Object.defineProperty(Array.prototype, `empty`, {
  value: function() { this.length == 0 }
});