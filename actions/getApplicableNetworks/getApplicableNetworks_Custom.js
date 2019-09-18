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
		This action will get all applicable networks for a user as configured by the reservations assigned to a business 
		group. This action will also present a friendly name to the user by grabbing the name and description from the 
		network profile and formatting it to the user as: <Network Profile Name> - <Network Description>. The actual value
		will remain the value of the network adapter, as assigned in reservation.

	Requirements: 
		- Must have VCACHost endpoint configured in vRO

	Output:
		This action outputs an Array of Properties. You action must be configured using these settings.

	Notes:
		This was configured to work with a custom third party IPAM solution called Netdot. As a result you may see references
		to this IPAM provider in the comments below. This should work with other IPAM providers as well without modification.



	Todo: If more than one IaaS host is present, select the default. var vcacHosts = Server.findAllForType("vCAC:VCACHost"); 
*/



///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////Functions///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getNetworkRangesFromReservation() {
	/* This function grabs network ranges from reservations accociated with the user who called the action. It then returns an array of network range 
	   objects that includes details of those ranges.
	   
		Example returned data for one single range: (In some cases there be multiple network range objects in the array.)
	   [{
  	   		"name": "10.128.191.224/28",
  			"rangeDescription": "IS_VRA_TEST3",
  			"networkProfileId": "d5aa4841-3b86-49f3-9ddf-c6033db3a52c",
  			"rangeId": "bfb18c99-c2d8-45fd-8a94-aa29f27ff3c9",
  			"rangeState": 1,
  			"externalId": "10.128.191.224/28"
 		}]
	*/
	 
	var networkRanges = [];
	var countRanges = 0;
	
	// 	Inputs: vcacHost [vCAC:VCACHost]  
	// 	readModelEntitiesBySystemExpandQuery(String hostId, String modelName, String entitySetName, String filter, String expand, String orderBy, String select, int top, int skip, Properties headers)
	var netRanges = vCACEntityManager.readModelEntitiesBySystemExpandQuery(vcacHosts[0].id,"ManagementModelEntities.svc","StaticIPv4Ranges",null,'StaticIPv4NetworkProfile/ID',null,null,null,null,null);

	for each (netRange in netRanges){
		// Create Object and push to array
		countRanges++;
		var networkRange = {};
		networkRange["name"] = netRange.getProperties().get("StaticIPv4RangeName");
		networkRange["rangeDescription"] = netRange.getProperties().get("IPv4RangeDescription");
		networkRange["networkProfileId"] = netRange.getLink(vcacHosts[0], "StaticIPv4NetworkProfile")[0].getProperties().get("ID"); //Gets the id from a foreign key in StaticIPv4NetworkProfile
		networkRange["rangeId"] = netRange.getProperties().get("ID");
		networkRange["rangeState"] = netRange.getProperties().get("StaticIPv4State");
		networkRange["externalId"] = netRange.getProperties().get("ExternalId");
		networkRanges.push(networkRange);
	}
/*  debug logging
	System.debug("Number of network profiles found:" + countRanges);
	System.debug("Returning raw network range data:");
	System.debug(JSON.stringify(networkRanges, null,' '));
*/
	return networkRanges;
}

function getExternalIdAndDescription(name){
	// getExternalIdAndDescription takes in a network profile name (string) and returns am object that include range external ID and range description as defined in Netdot.
	// These values are pulled from Netdot when the range is initially configured. If the details of the range get updated in netdot, simply navigate to the range in vRA 
	// open it. It will make the call to Netdot automatically and update the record. 
	
	// Get the network ranges from the reservation
	//var networkRanges = getNetworkRangesFromReservation();
	System.debug("Number of ranges found: " + networkRanges.length);
	System.debug("Name parameter: " + name);
	
	for(var i = 0 ; i < networkRanges.length ; i++ ) {
		// loop though the returned ranges until a match is found, then return an object containing externalId and rangeDescription. These values coorelate to values found in Netdot.
		if(networkRanges[i].name == name) {
			System.debug(name + " = " + networkRanges[i].externalId);
			System.debug(name + " = " + networkRanges[i].rangeDescription);
			
			/* Example of returned data:
			   {
 			   		"externalId": "10.128.191.224/28",
 					"rangeDescription": "IS_VRA_TEST3"
			   }
			*/
			return {externalId:networkRanges[i].externalId,rangeDescription:networkRanges[i].rangeDescription};
		}	
	}
	// If we fall out of the loop without a successful match throw error
	throw "externalId with name: " + name + " was not found!";
}

function compare(a, b){
	// This function is used to compare objects in an array for the purpose of sorting.
	// Example: sortArray.sort(compare);
	
	// Parse the network address, then split into octets
	var a = a.label.split("/")[0].split('.');
  	var b = b.label.split("/")[0].split('.');
	//System.log("A: " + labelA);
	//System.log("B: " + labelB);
  	
	// Compare octets
	for( var i = 0; i < a.length; i++ ){
		if((a[i] = parseInt(a[i])) < (b[i] = parseInt(b[i])))
			return -1;
		else if( a[i] > b[i] )
			return 1;
	}
	
	return 0;
}




///////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////   Main   /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////	


// Define variables

var blueprint = System.getContext().getParameter("__asd_composition_blueprintId");
// var component = System.getContext().getParameter("__asd_composition_componentId");
var user = System.getContext().getParameter("__asd_requestedFor");
var tenant = System.getContext().getParameter("__asd_tenantRef");
var subtenantId = System.getContext().getParameter("__asd_subtenantRef")

System.log("Blueprint: " + blueprint);
System.log("ComponentID: " + component);
System.log("requestedFor: " + user);
System.log("tenantRef: " + tenant);
System.log("sybtenantRef: " + subtenantId);

// Find all IaaS hosts. Change this later to add logic to select only the DEFAULT host
var vcacHosts = Server.findAllForType("vCAC:VCACHost"); 
System.debug(vcacHosts);

// Checks if the default host is already added and returns it. 
var host = vCACCAFEHostManager.getDefaultHostForTenant(tenant , true);
// Get reservations for the user
var reservations = System.getModule("com.vmware.vra.reservations").getReservationsForUserAndComponent(user, tenant, host, blueprint, component, subtenantId);

var networkRanges = getNetworkRangesFromReservation();

var sortArray = [];
var returnArray = [];

for each(var res in reservations) {
	
	var extensionData = res.getExtensionData();
	var keys = extensionData.keySet();
	var networks = extensionData.get("reservationNetworks");
		
	if(networks) {
		for each(var network in networks.getValue()) {
			var path = network.getValue().get("networkPath");
			var profile = network.getValue().get("networkProfile");
			var rangeObj = getExternalIdAndDescription(profile.label);
			
			//System.debug(JSON.stringify(rangeObj, null, ' '));
			//System.debug(path.label + ", " + rangeObj.externalId + " - " + rangeObj.rangeDescription);
			
			sortArray.push({value: path.label, label: rangeObj.externalId + " - " + rangeObj.rangeDescription});			
		}
	}		
}

sortArray.sort(compare);
System.log(" ");
System.log("Returning sorted networks:");
for(var i = 0 ; i < sortArray.length ; i++ ) {
	var applicableNetworks = new Properties();
	System.log(sortArray[i].label);
	
	applicableNetworks.put('value', sortArray[i].value);
	applicableNetworks.put('label', sortArray[i].label);

	returnArray.push(applicableNetworks);
}

return returnArray;