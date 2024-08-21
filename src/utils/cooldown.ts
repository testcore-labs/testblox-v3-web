class cooldown {
  data: {[key: number|string]: number} = {};

  apply(key: number|string, time: number = 0): [boolean, number] {
    let now = Date.now()
    let diff = this.data[key] - now;
    if(this.data[key] && diff > 0) {
      return [false, diff];
    } else {
      this.data[key] = now + time;
      return [true, this.data[key] - now];
    }
  }
}

export default (new cooldown());