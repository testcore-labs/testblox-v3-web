class cooldown {
  data: {[key: number|string]: {
    time: number,
    current: number,
    max: number,
    consequence: number
    consequence_given: boolean
  }} = {};

  apply(key: number|string, time: number = 0, max: number = 1, consequence: number = 0): [boolean, number, number, number] {
    let now = Date.now()
    let diff = (this.data[key] ? this.data[key].time : 0) - now;
    if(this.data[key] && (this.data[key] && diff > 0)) {
      if(this.data[key].current >= this.data[key].max) {
        if(!this.data[key].consequence_given) {
          this.data[key].time += consequence;
          diff += consequence; // so you actually get it at the first blocked ~~requset~~ cooldown
          this.data[key].consequence_given = true;
        }
        return [false, diff, this.data[key].current, this.data[key].max];
      } else {
        if(this.data[key]) {
          this.data[key].current += 1;
        }
        return [true, diff, this.data[key].current, this.data[key].max]
      }
    } else {
      this.data[key] = {
        time: now + time,
        current: 0,
        max: max,
        consequence: consequence,
        consequence_given: false
      };
      return [true, diff, this.data[key].current, this.data[key].max];
    }
  }
}

export default (new cooldown());