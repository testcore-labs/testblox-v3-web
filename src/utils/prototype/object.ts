Object.defineProperty(Object.prototype, `empty`, {
  value: function() { this.length == 0 }
});