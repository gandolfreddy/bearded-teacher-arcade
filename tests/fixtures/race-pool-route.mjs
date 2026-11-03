import {createRacer,steerRacer,stepRacer} from '../../games/assets/racer-model.mjs';
export const poolRoute=[[0,85],[72,85],[34,45],[310,85],[227,45],[0,45],[115,100]];
export function raceRoute(){
  let state=createRacer(),index=0;const actions=[],values=[0,.2,.4,.6,.8,.99],random=()=>values[index++%values.length];
  for(let t=0;t<1600&&state.status==='playing';t++){
    const row=state.obstacles.find(row=>row.y<436&&row.y+50>275);
    let target=state.lane;if(row?.lanes.includes(target))target=[0,1,2].find(lane=>!row.lanes.includes(lane));
    const delta=target-state.lane;actions.push(delta);if(delta)state=steerRacer(state,delta);
    state=stepRacer(state,.05,{},random);state=stepRacer(state,.05,{},random);
  }
  return {actions,state};
}
