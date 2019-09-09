/* 

This action will generate a random string that meets the following critera:

The string must contain at least 1 lowercase alphabetical character
The string must contain at least 1 uppercase alphabetical character
The string must contain at least 1 numeric character
The string must contain at least one special character, but we are escaping reserved RegEx characters to avoid conflict
The string must be eight characters or longer

The string length will be varied from 10-15 characters. You can configure the length and variation by configuring baseLength and variator.

*/

// Setup the strength criteria (listed above)
var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{10,})");

///////////////////////
/////  FUNCTIONS //////
///////////////////////

function generateString () {
	var string = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&_";
	var lengthModifier = Math.floor(Math.random() * variator);
	var length = baseLength + lengthModifier;
	
	for (var i = 0; i < length; i++){
    	string += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	
	return string;
}

//////////////////
/////  MAIN //////
//////////////////


// Modify these lines to adjust the length and length variation of the string.

// baseLength sets the minimum string length.
var baseLength = 10;
// variator sets the amount a string length will be varied (calculated at n - 1). Meaning a value of 6 will at vary a string by 0-5 characters
// Example: baseLength = 10, variator = 6. The generated string will be between 10-15 characters.
var variator = 6;


// Check to see if the generated string matches the strength requirements. If it doesn't, regenerate it until it does. Then return it.
do {
	var strong = '';
	var strong = generateString();
	//System.log("Strong? : " + strongRegex.test(strong));
	if(strongRegex.test(strong)) {
		//System.log(strong);
		return strong;
	}
}
while (!strongRegex.test(strong));