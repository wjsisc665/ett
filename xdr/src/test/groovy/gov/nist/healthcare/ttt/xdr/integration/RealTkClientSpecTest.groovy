package gov.nist.healthcare.ttt.xdr.integration

import gov.nist.healthcare.ttt.xdr.helpers.testFramework.TestApplication
import gov.nist.healthcare.ttt.xdr.web.GroovyRestClient
import groovy.util.slurpersupport.GPathResult
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.test.IntegrationTest
import org.springframework.boot.test.SpringApplicationContextLoader
import org.springframework.test.context.ContextConfiguration
import org.springframework.test.context.web.WebAppConfiguration
import spock.lang.Specification

/**
 * Created by gerardin on 10/9/14.
 */
@WebAppConfiguration
@IntegrationTest
@ContextConfiguration(loader = SpringApplicationContextLoader.class, classes = TestApplication.class)
class RealTkClientSpecTest extends Specification {

    @Value('${xdr.notification')
    private String notificationUrl

    @Value('${toolkit.createSim.url}')
    private String createSimUrl

    @Autowired
    GroovyRestClient client

    def "test successful endpoint creation"() {
        given:

        def id = "SimpleTest1"

        /*
        <actor type='docrec'>
            <transaction name='prb'>
                <endpoint value='http://localhost:8080/xdstools3/sim/PnrSoapTest/docrec/prb'/>
                <settings>
                  <boolean name='schemaCheck' value='true' />
                  <boolean name='modelCheck' value='false' />
                  <boolean name='codingCheck' value='false' />
                  <boolean name='soapCheck' value='true' />
                  <text name='msgCallback' value='' />
                  <webService value='prb'  />
                </settings>
            </transaction>
        </actor>
         */


        def config = {
            actor(type: 'docrec') {

                transaction(name: 'prb') {
                    endpoint(value: 'NOT_USED')
                    settings {
                        "boolean"(name: 'schemaCheck', value: 'true')
                        "boolean"(name: 'modelCheck', value: 'false')
                        "boolean"(name: 'codingCheck', value: 'false')
                        "boolean"(name: 'soapCheck', value: 'true')
                        text(msgCallBack: "http://localhost:8080/ttt/$notificationUrl")
                        webservices(value: 'prb')
                    }
                }
            }
        }

        def url = "$createSimUrl/$id"

        when:
        def resp = client.postXml(config, url, 1000)

        then:
        println resp.text()

        when:
        def getConfigUrl = "http://localhost:9080/xdstools3/rest/sim/config/$id"
        GPathResult resp2 = client.getXml(getConfigUrl, 1000)

        then:
        def transactions = resp2.depthFirst().findAll{it.name() == "endpoint"}
        assert transactions.size() == 2
        transactions.each {
            println it.@value
            assert ((String)it.@value).contains(id)
        }


    }


}