const suites=Object.freeze({
    unit:Object.freeze({label:'Unit',module:'./unit.js'}),
    functional:Object.freeze({label:'Functional',module:'./functional.js'}),
    integration:Object.freeze({label:'Integration',module:'./integration.js'}),
    regression:Object.freeze({label:'Regression',module:'./regression.js'})
});

const suiteNames=Object.freeze(Object.keys(suites));

export {suiteNames,suites};
export default suites;
