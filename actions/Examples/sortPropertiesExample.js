/* 	Example: vRO Sorting Properties Workaround
		While it doesn't appear you can sort a properties object itself directly in vRO, you can still achieve the same results using this workaround. 
		(Big thanks to Shazad for this tip!)

		TLDR; create an array of property objects and they will be returned in the order listed in the array.

		Author: Craig Sorensen
		vRA/vRO Version: 7.6
*/


function addToArray(prop){  
     System.log("Adding: " + prop.get("value"));  
     array.push(prop);  
}  
  
var array = [];  
  
for(var i = 0 ; i < 2 ; i++ ) {  
     var property = new Properties();  
  
     property.put('label','label'+i);  
     property.put('value','value'+i);  
  
     addToArray(property);  
}  
  
for each (item in array){  
     System.log("item: " + item.get("label"));  
     System.log("item: " + item.get("value"));  
}  
  
return array;  