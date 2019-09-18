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
		This action will retrive the distinguishedName defined in an AD policy configured in a business group, then parses 
		out a specified OU based on location in the string.

	Requirements: 
		- Must have VCACHost endpoint configured with a default endpoint configured.
		- Requesting user must be a member of a business group with an AD policy must be assigned

	Configure:
		Configure location of OU in the string. This is done by configuring the spliceAmount variable

	Output:
		Returns a string

*/


/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// Functions /////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////


function getAdPolicy(subid){
	// This function takes in the subtenantId(business group), looks up the AD policy assigned to the business group, 
	// then returns an object containing the domain, distiguishedName of the OU, and the adhost.
	
	var cafeHost = Server.findAllForType("vCACCAFE:VCACHost")[0];	

	//get the vCACCAFEBusinessGroup object(shown under Business Group (Deprecated) in the vRO inventory viewer)  
	var businessGroup = vCACCAFEEntitiesFinder.getBusinessGroup(cafeHost, subid);  
	  
	//get the custom properties of the business group object  
	var adPolicyName =[]; 
	var properties = businessGroup.customProperties;  
	for each (var prop in properties){  
	     if(prop.name == 'ext.policy.activedirectory.system.id'){  
	          //the custom property name matches the AD Policy property name  
	          adPolicyName.push(prop.value);  
	          System.log('Found AD Policy assigned to BG with name: ' + prop.value);  
	     }  
	}  	

	if (!adPolicyName.length){throw "Business group does not have AD policy assigned!"}
	if (adPolicyName.length > 1){throw "Business group returned multiple Active Directory Policies!"}	

	// Create REST client to ASD service
	var restClient = cafeHost.createAdvancedDesignerClient();
	var policyObject = null;	

	try {
		// Get request expanding template variables in order.
		policyObject = restClient.getWithVariables("policies/hrid/{hrid}", [adPolicyName[0]]).getBodyAsJson();
	} catch (error) {
		throw "No policy with id '" + adPolicyName[0] + "' found. Error: " + error;
	}	

	var ret = {};
	// grab the values in the the AD policy
	for each(prop in policyObject.properties.entries) {
		var val = prop.value ? prop.value.value : null;
		switch(prop.key) {
			case "ext.policy.activedirectory.domain":
				ret.domainName = val;
				break;
			case "ext.policy.activedirectory.orgunit":
				ret.ouDN = val;
				break;
			case "ext.policy.activedirectory.endpoint.id":
				ret.adHostId = val;
				break;
			default:
				System.log("Unrecognized property '" + prop.key + "' with value = '" + val);
		} 
	}	

	return ret;
}

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// Main ////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

// Configure which chunk of the distinguished name contains your OU
var spliceAmount = 4;

// DCI Business Group, use for testing
//var subtenantId = "07eb843e-08e4-4ab2-938e-2b85160c8d74";

// Get business group from provisioning request
var subtenantId = System.getContext().getParameter("__asd_subtenantRef");

var policyObj = getAdPolicy(subtenantId);

System.debug("OU being returned: " + (policyObj.ouDN).split(",").reverse()[spliceAmount].substr(3));

return (policyObj.ouDN).split(",").reverse()[spliceAmount].substr(3);