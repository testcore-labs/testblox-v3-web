class cooldown {
  data: {[key: number|string]: {
    time: number,
    current: number,
    max: number
  }} = {};

  apply(key: number|string, time: number = 0, max: number = 1): [boolean, number] {
    let now = Date.now()
    let diff = (this.data[key] ? this.data[key].time : 0) - now;
    if(this.data[key] && (this.data[key] && diff > 0)) {
      if(this.data[key].current >= this.data[key].max) {
        return [false, diff];
      } else {
        if(this.data[key]) {
          this.data[key].current += 1;
        }
        return [true, diff]
      }
    } else {
      this.data[key] = {
        time: now + time,
        current: 0,
        max: max,
      };
      return [true, diff];
    }
  }
}

export default (new cooldown());