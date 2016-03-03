//
//  SecureProxyProvider.h
//  SecureProxyProvider
//
//  version 1.0
//  updated on 2015/11/30
//
@protocol SecureProxyProvider <NSObject>
/**
 * Start secure proxy provider.
 * @param option: key/value map of the parameters the provider needs. The only required key is "proxyID" and "proxyURL".
 *        proxyID is used as the return value for getProxyID method.
 *        proxyURL is uesd to initialize the proxy native library
 * @param completion: a completion block which should be called to report success or fail, or reporting an event.
 *         the library should keep a reference of this block to be used during secure proxy's life time
 *         The completion block should be release when stopProxy is called
 *         the data parameter may have the below propertes
 *               type: "success|error|event";
 *                   if "type" is "success", it indicates the secure proxy tunnel is established.
 *                   in that case the below properties should be included in the data object
 *                      user:”[username]”,
 *                      password:”[password]”,
 *                      port:[Int],
 *                      host:[String] //optional, default is 127.0.0.1
 *
 *                   if "type" is "error", it indicates the secure proxy tunnel gets an error and stop working.
 *                   in that case the below properties should be included in the data object
 *                      errID:”[int]”,
 *                      errMsg:”[ErrorMessage]”,
 *
 *
 *                   if "type" is "event", it indicates an status event happens in proxy tunnel, caller can report
 *                   the status to user, or log the event in data store.
 *                   in that case the below properties should be included in the data object
 *                      level:”error|warn|info|debug”,
 *                      id:”[int]”,
 *                      msg:[String],
 *
 */
- (void) startProxy:(NSDictionary*)option withCallbackBlock:(void(^)(NSDictionary* data))completion;


/**
 * The method to stop the secure proxy and relase the resource used by secure proxy
 * @parma completion: a complemetion block to report the result. If error parameter is null, then the operaton succeed.
 *        Otherwise the operation failed and the error parameter contains the related error information
 *
 */
- (void) resetProxy:(void(^)(NSError* error))completion;

/**
 * The method to get current proxy id, this method is used by kapsel SDK to identify the proxy provider type. This method is
 *        reserved for supporting multiple proxy providers in a single fiori app in future.
 * @parma completion: a complemetion block to report the result. If error parameter is null, then the operaton succeed.
 *        Otherwise the operation failed and the error parameter contains the related error information
 *
 */
- (NSString*) getProxyID;

@end
