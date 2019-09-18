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
		This looks at a custom property defined in the business group to determine the machine prefix

	Requirements: 
		- Must have VCACHost endpoint configured with a default endpoint configured.
		- Requesting user must be a member of a business group with an AD policy must be assigned

	Configure:
		define the name of the custom property my modifying the property variable

	Output:
		Returns a string

*/

// configure property name here
var property = "UO.BG.OuPrefix";

// Get the subtentandId (business group) from the form request
var subtenantId = System.getContext().getParameter("__asd_subtenantRef")

var cafeHost = Server.findAllForType("vCACCAFE:VCACHost")[0];
businessGroups = vCACCAFEEntitiesFinder.getSubtenants(cafeHost);

for each (group in businessGroups) {
	System.log("group: " + group.name);
    if (group.id == subtenantId) {
         keyData = group.extensionData.get(property);
         propertyValue = keyData.value.get("value").value;
		 return propertyValue	
    }
}

if (!propertyValue){throw "OU property not defined in Business Group"}
