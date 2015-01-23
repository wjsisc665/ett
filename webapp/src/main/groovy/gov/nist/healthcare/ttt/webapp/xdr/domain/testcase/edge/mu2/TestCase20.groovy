package gov.nist.healthcare.ttt.webapp.xdr.domain.testcase.edge.mu2
import gov.nist.healthcare.ttt.database.xdr.XDRRecordInterface
import gov.nist.healthcare.ttt.database.xdr.XDRTestStepInterface
import gov.nist.healthcare.ttt.direct.messageGenerator.MDNGenerator
import gov.nist.healthcare.ttt.direct.sender.DirectMessageSender
import gov.nist.healthcare.ttt.webapp.direct.listener.ListenerProcessor
import gov.nist.healthcare.ttt.webapp.xdr.core.TestCaseExecutor
import gov.nist.healthcare.ttt.webapp.xdr.domain.TestCaseBuilder
import gov.nist.healthcare.ttt.webapp.xdr.domain.TestCaseEvent
import gov.nist.healthcare.ttt.webapp.xdr.domain.testcase.StandardContent
import gov.nist.healthcare.ttt.webapp.xdr.domain.testcase.TestCaseBaseStrategy
import gov.nist.healthcare.ttt.xdr.domain.TkValidationReport
/**
 * Created by gerardin on 10/27/14.
 */
final class TestCase20 extends TestCaseBaseStrategy {

    public TestCase20(TestCaseExecutor ex) {
        super(ex)
    }

    @Override
    TestCaseEvent run(String tcid, Map context, String username) {

        XDRTestStepInterface step = executor.executeDirectAddressCorrelationStep(tcid, context.directFrom)

        //Create a new test record.
        XDRRecordInterface record = new TestCaseBuilder(tcid, username).addStep(step).build()

        executor.db.addNewXdrRecord(record)

        log.info  "test case ${tcid} : successfully configured. Ready to receive messages."

        def content = new StandardContent()
        content.endpoint = step.xdrSimulator.endpointTLS

        return new TestCaseEvent(XDRRecordInterface.CriteriaMet.PENDING, content)
    }

    @Override
    public void notifyXdrReceive(XDRRecordInterface record, TkValidationReport report) {

        XDRTestStepInterface step = executor.executeStoreXDRReport(report)

        XDRRecordInterface updatedRecord = new TestCaseBuilder(record).addStep(step).build()

        def generator = new MDNGenerator();
        generator.setReporting_UA_name("direct.nist.gov");
        generator.setReporting_UA_product("Security Agent");
        generator.setDisposition("automatic-action/MDN-sent-automatically;processed");
        generator.setFinal_recipient("transport-testing.nist.gov");
        generator.setFromAddress("test@transport-testing.nist.gov");
        generator.setOriginal_message_id("<812748939.14.1386951907564.JavaMail.tomcat7@ip-10-185-147-33.ec2.internal>");
        generator.setSubject("Automatic MDN");
        generator.setText("Your message was successfully processed.");
        generator.setToAddress("to@hit-dev.nist.gov");
        generator.setEncryptionCert(generator.getEncryptionCertByDnsLookup("to@hit-dev.nist.gov"))

        private ListenerProcessor listener = new ListenerProcessor()
        listener.setCertificatesPath('${direct.certifiactes.repository.path}')
        listener.setCertPassword('${direct.certificates.password}')

        generator.setSigningCert(listener.getSigningPrivateCert("good"))
        generator.signingCertPassword('${direct.certificates.password}')

        def mdn = generator.generateMDN()

        new DirectMessageSender().send(25,"toAddress@hit_dev.nist.gov", mdn,"fromAddress","toAddress@localhost")

        done(XDRRecordInterface.CriteriaMet.MANUAL, updatedRecord)

    }
}
