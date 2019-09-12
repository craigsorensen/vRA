/*
	Written By: Craig Sorensen
	URL: https://github.com/craigsorensen
	version: 1.0.0

	Disclaimer:
		THE SAMPLE CODE IS PROVIDED “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF 
		MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS 
		BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT 
		LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
		SUSTAINED BY YOU OR A THIRD PARTY, HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
		STRICT LIABILITY, OR TORT ARISING IN ANY WAY OUT OF THE USE OF THIS SAMPLE CODE, EVEN IF ADVISED OF THE POSSIBILITY 
		OF SUCH DAMAGE.
	
	Description:
		This action will take the distinguishedName from an AD policy defined in vRA and find all the child OUs
		and return these back to vRA. When combined with the ext.policy.activedirectory.orgunit custom property 
		configured as a drop down menu, this will allow a user to chose their bind location in AD.

	Requirements: 
		- Must have ActiveDirectory plug-in installed and configured with a default endpoint configured.
		- There is a dependency on the getAdPolicySettingsFromBusinessGroup action. 
		- Requesting user must be a member of a business group with an AD policy must be assigned

	Configure:
		- Define spliceAmount variable in dnToPath function
		- Define path to getAdPolicySettingsFromBusinessGroup action in the main section

	Output:
		This action outputs an Array of Properties. You action must be configured using these settings.
*/

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////    Functions    //////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////

function dnToPath(dn){

	// This function takes in a distinguishedName(string), strips out unwanted elements
	// then returns a string in a path format. 
	// Example input: OU=Computers,OU=IS,OU=Units,DC=ad,DC=example,DC=com
	// Example output: IS\Computers
	// Configure: You can adjust the amount of the distinguishedName to trim off by adjusting the spliceAmount variable.

	var spliceAmount = 4;
	
	var dnChunks = [];
	var dnChunks = dn.split(",");

	dnChunks.reverse().splice(0,spliceAmount);
	for(var i = 0 ; i < dnChunks.length ; i++ ) {
		dnChunks[i] = dnChunks[i].substr(3);
	}
	var path = dnChunks.join("\\")

	return path;
}

function searchAD(searchTerms){
	//Note: Must have ActiveDirectory plug-in installed and configured with a default endpoint configured.
	System.debug("Searching AD!");
	var results = ActiveDirectory.search("OrganizationalUnit", searchTerms);
return results;
}

function addToOUList(commonName,distinguishedName){
	// This function takes in a commonName and distinguishedName (both strings) and addes them
	// to a property, then add that property to an array. This is required for proper sorting in vRA.
	// Example inputs: (Computers, OU=Computers,OU=IS,OU=Units,DC=ad,DC=example,DC=com)
	// Output: This function does not return any values, but adds values to a global array.

	var dnPath = dnToPath(distinguishedName);
	var dnProperties = new Properties();
	var parentExistsInArray = false;
	

	// Check to make sure the DN is nested somwehere below the DN defined in the AD Policy
	if(distinguishedName.toLowerCase().indexOf(adPolicy.toLowerCase()) !== -1){
		if (returnArray.length == 0){
			System.debug("First OU dn! Adding: " + distinguishedName)

			dnProperties.put("label",dnPath);
			dnProperties.put("value",distinguishedName);
			returnArray.push(dnProperties);
			return;
		}
	
		for(var i = 0 ; i < returnArray.length ; i++ ) {
			
			// Define conditions for dn to be added to global array
			if (returnArray[i].get("label") == dnPath){
				System.debug("Skipping: " + dnPath + " - already exists in array");
				return;
			}
			
			var dnParentPath = dnPath.split("\\");
			dnParentPath.pop();
			dnParentPath = dnParentPath.join("\\");
			// check to make sure parent exists in the array already, if not wait. This is needed for proper sorting of the array.
			if (returnArray[i].get("label") == dnParentPath){
				System.debug("Parent exists in array. Setting flag to true.");
				parentExistsInArray = true;	
			}	
		}
		if (parentExistsInArray){
			System.debug("Adding dn: " + dnPath)
			dnProperties.put("label",dnPath);
			dnProperties.put("value",distinguishedName);
			returnArray.push(dnProperties);
		}
	}
}

function checkForSubOU(ou, parentDN){
	// Takes an OU(object), and optional distinguishedName(string), then checks to see if there are any sub-OUs.
	var SearchResults = searchAD(ou)
	
	if (!parentDN){ var parentDN = adPolicy; }
	
	System.debug("Results returned from AD: " + SearchResults.length)
	for each (result in SearchResults){
		System.debug(result.getAttribute("distinguishedName"))
	}
	
	// Check if search returned any results
	if (SearchResults.length == 0){
		System.log("No OUs found for: " + ou)
		return;
	}
	
	// If more than one result returned, find result one result that matches exactly
	if (SearchResults.length > 1){
		System.debug("More than 1 OU returned!");
		
		for(var i = 0 ; i < SearchResults.length ; i++ ) {
			System.debug("Parent DN: " + SearchResults[i].getAttribute("distinguishedName"));
			if (SearchResults[i].getAttribute("distinguishedName").toLowerCase().indexOf(parentDN.toLowerCase()) !== -1){
				
				// After unique match is found, select try to add to OU list.
				System.debug("Selecting OU: " + SearchResults[i].getAttribute("distinguishedName"));
				addToOUList(SearchResults[i].getAttribute("name"),SearchResults[i].getAttribute("distinguishedName"));
				
				var childOUs = SearchResults[i].organizationalUnits
				System.debug("children: " + childOUs.length);
				
				// check for child OUs that might exist below the parent OU slected above.
				if (childOUs.length == 0 ){System.debug("No child OUs exist for: " + SearchResults[0].getAttribute("name"))}
		
				for each (var child in childOUs){	
					// Try adding child to OU list, then check the child for nested children
					var ouDN = child.distinguishedName;
					System.debug("I'm a child: " + child.distinguishedName);
					addToOUList(child.name,child.distinguishedName);
					checkForSubOU(child.name, SearchResults[i].getAttribute("distinguishedName"));

				}				
			}
		}	
	}
	else {
		// if only one unique match was found, try adding it to the OU list then check for children. If children exist, also check them for nested children
		System.debug("Found 1 unique OU!");
		System.debug("Parent DN: " + SearchResults[0].getAttribute("distinguishedName"));
		
		if (SearchResults[0].getAttribute("distinguishedName").toLowerCase().indexOf(parentDN.toLowerCase()) !== -1){
			addToOUList(SearchResults[0].getAttribute("name"),SearchResults[0].getAttribute("distinguishedName"));	
		}
		
		var childOUs = SearchResults[0].organizationalUnits
		System.debug("children: " + childOUs.length);
		
		if (childOUs.length == 0 ){System.debug("No child OUs exist for: " + SearchResults[0].getAttribute("name"))}
		
		for each (var child in childOUs){	

			var ouDN = child.distinguishedName;
			System.debug("I'm a child: cn - " + child.name + " dn - " + child.distinguishedName);
			addToOUList(child.name,child.distinguishedName);
			checkForSubOU(child.name);

		}
	}	
}

function addToArray(prop){
		// takes in a property object adds it to global array
    if (array.length == 0){
		System.log("Adding: " + prop.get("value"));
		array.push(prop);
		return;
	}
	
	for each (item in array){
		//System.log("item: " + item.get("value"));
		//System.log("prop: " + prop.get("value"));
		
		if (item.get("value") == prop.get("value")){
			System.debug("Skipping: " + prop.get("value") + " already exists in array");
			return;
		}	
	}
	System.log("Adding: " + prop.get("value"));
	array.push(prop);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////   MAIN   /////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////

// Get the AD policy from the users business group
var policyObject = System.getModule('DEFINE YOUR LOCATION HERE').getAdPolicySettingsFromBusinessGroup();
var adPolicy = policyObject.ouDN;

var Children = [];
var returnArray = [];

var ouPaths = new Properties();

// get the parent out Common Name from the AD policy. This is used as the top level search criteria.
var cn = adPolicy.split(",")[0].substr(3);


checkForSubOU(cn);

if (returnArray.length == 0) {throw "No OUs were found that matched your search criteria!!"}

System.log("Results being returned:");
for each (item in returnArray){
	System.log(item.get("label"));
	//System.log("value: " + item.get("value"));
}
return returnArray;