import R from 'ramda'


/***
  *If there are two messages where the _companyMessageId matches the _id
  *of the other record, pop the record that has been matched.
  *This will be the default company message that has not been read
  *by the user.
  *@property{Message} companyMessages Array of messages
  *@returns{Message} Array of company messages sans duplicates
**/

function removeDuplicates(companyMessages){
    //Search for duplicates if duplicate found, true is returned by function thus the !
    let hasDuplicate =  (x) => !R.is(Object,R.find(R.propEq('_companyMessageId',x._id))(companyMessages))
    return R.filter(hasDuplicate,companyMessages)
}




export default { removeDuplicates };
