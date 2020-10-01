module.exports = {
	requestDidStart(requestContext) {
		if (!requestContext.request.query.includes("query IntrospectionQuery")){
			console.log("Request started! Query:\n" +
				requestContext.request.query)
		}
	}
}