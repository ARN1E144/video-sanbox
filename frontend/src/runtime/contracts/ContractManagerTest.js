import contracts from "./ComponentContract.js";


class ComponentContractManager {


constructor(){

    this.contracts = contracts;

}



getContract(type){

    return this.contracts[type] || null;

}



getBindings(type){

    return this.getContract(type)?.bindings || {};

}



getActions(type){

    return this.getContract(type)?.actions || {};

}



getTargets(type){

    return this.getContract(type)?.targets || {};

}


}


export default new ComponentContractManager();