Object.defineProperty(String.prototype, `empty`, {
  value: function() { this.length == 0 }
});