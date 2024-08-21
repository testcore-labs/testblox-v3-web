interface Number {
  clamp(min: number, max: number): number;
}

Object.defineProperty(Number.prototype, `clamp`, {
  value: function(min: number, max: number) { return Math.min(Math.max(this, min), max); }
});