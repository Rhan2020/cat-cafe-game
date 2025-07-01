module.exports = {
  register:{ metrics:()=>'' },
  collectDefaultMetrics: ()=>{},
  Counter: class { constructor(){ this.inc=()=>{} }},
  Gauge: class { constructor(){ this.set=()=>{} }},
  Histogram: class { constructor(){ this.observe=()=>{} }},
  Summary: class { constructor(){ this.observe=()=>{} }}
};