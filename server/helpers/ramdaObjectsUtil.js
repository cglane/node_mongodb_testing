import R from 'ramda';
import _ from 'underscore';

function nestedObject(listA, listB) {
  const rtrnObj = {};
  _.each(listA, (keyA) => {
    rtrnObj[keyA] = {};
    _.each(listB, (keyB) => {
      rtrnObj[keyA][keyB] = {};
    });
  });
  return rtrnObj;
}

export default { nestedObject };
