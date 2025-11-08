import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * PrivacyPolicy - Legal privacy policy page
 * 
 * Compliant with:
 * - Philippine Data Privacy Act of 2012 (R.A. 10173)
 * - GDPR principles
 * - International privacy standards
 */
const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Last Updated: November 8, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              EduSync ("we," "our," or "us") is committed to protecting the privacy and security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              School Information System (the "Service").
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              This policy complies with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and its 
              Implementing Rules and Regulations, as well as international data protection standards.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">Student Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Full name, date of birth, and contact information</li>
              <li>Learner Reference Number (LRN) and student ID</li>
              <li>Enrollment details and academic records</li>
              <li>Grades, attendance records, and assessment data</li>
              <li>Disciplinary records and core values assessments</li>
              <li>Emergency contact information</li>
              <li>Photos and documents uploaded by parents/guardians</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">Parent/Guardian Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Full name, email address, and phone number</li>
              <li>Relationship to student</li>
              <li>Account credentials (encrypted)</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">Teacher/Staff Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Full name, email address, and contact information</li>
              <li>Employee ID and position</li>
              <li>Class schedules and assignments</li>
              <li>Account credentials (encrypted)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">School Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>School name, address, and contact details</li>
              <li>School ID and DepEd registration information</li>
              <li>Academic year and term settings</li>
              <li>Curriculum and grading configurations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">Technical Data</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage data and analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Educational Services:</strong> Managing student records, grades, attendance, and assessments</li>
              <li><strong>Communication:</strong> Sending notifications about grades, attendance, announcements, and school events</li>
              <li><strong>Compliance:</strong> Meeting DepEd requirements and generating required reports (Form 137, Form 138, SF2, etc.)</li>
              <li><strong>Analytics:</strong> Improving our Service and understanding usage patterns</li>
              <li><strong>Security:</strong> Protecting against unauthorized access and ensuring data integrity</li>
              <li><strong>Support:</strong> Responding to inquiries and providing customer service</li>
              <li><strong>Legal Obligations:</strong> Complying with applicable laws and regulations</li>
            </ul>
          </section>

          {/* Data Sharing and Disclosure */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Sharing and Disclosure</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We do not sell, rent, or trade your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>With Your School:</strong> Your school administrators and authorized teachers have access to relevant student data</li>
              <li><strong>With Parents/Guardians:</strong> Parents can access their children's academic records</li>
              <li><strong>With DepEd:</strong> When required by law for compliance reporting</li>
              <li><strong>Service Providers:</strong> Third-party vendors who assist in providing the Service (e.g., cloud hosting, email delivery)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Encryption:</strong> Data is encrypted in transit (HTTPS/SSL) and at rest</li>
              <li><strong>Access Controls:</strong> Role-based access ensures users only see authorized data</li>
              <li><strong>Authentication:</strong> Secure login with password protection</li>
              <li><strong>Regular Backups:</strong> Automated backups to prevent data loss</li>
              <li><strong>Monitoring:</strong> Continuous monitoring for security threats</li>
              <li><strong>Infrastructure:</strong> Hosted on Google Cloud Platform with enterprise-grade security</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to 
              protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights (Philippine Data Privacy Act) */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Rights Under the Data Privacy Act</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Under the Philippine Data Privacy Act of 2012, you have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Right to be Informed:</strong> You have the right to know how your data is being collected, used, and shared</li>
              <li><strong>Right to Access:</strong> You can request access to your personal data we hold</li>
              <li><strong>Right to Correction:</strong> You can request correction of inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> You can request deletion of your data (subject to legal retention requirements)</li>
              <li><strong>Right to Object:</strong> You can object to certain processing of your data</li>
              <li><strong>Right to Data Portability:</strong> You can request your data in a structured, commonly used format</li>
              <li><strong>Right to File a Complaint:</strong> You can file a complaint with the National Privacy Commission</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              To exercise these rights, please contact us at <a href="mailto:official@edusync.ph" className="text-indigo-600 dark:text-indigo-400 hover:underline">official@edusync.ph</a>
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Retention</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We retain personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, 
              unless a longer retention period is required by law. Student academic records are retained in accordance with 
              DepEd retention policies and applicable Philippine laws.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Children's Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our Service is designed for use by schools to manage student information. We collect information about students 
              (including minors) only with the authorization of their school and parents/guardians. Parents have the right to 
              review, correct, or request deletion of their child's information, subject to school policies and legal requirements.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage, and improve our Service. 
              You can control cookie settings through your browser preferences. However, disabling cookies may limit certain 
              features of the Service.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Third-Party Services</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use the following third-party services to provide and improve our Service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Firebase (Google Cloud):</strong> Database, hosting, and authentication</li>
              <li><strong>SendGrid:</strong> Email notifications</li>
              <li><strong>Google Gemini:</strong> AI-powered lesson plan generation</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              These services have their own privacy policies governing the use of your information. We encourage you to review them.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the 
              new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the Service after 
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or wish to exercise your data privacy rights, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-2">
              <p className="text-gray-900 dark:text-white font-semibold">EduSync - School Information System</p>
              <p className="text-gray-700 dark:text-gray-300">
                Email: <a href="mailto:official@edusync.ph" className="text-indigo-600 dark:text-indigo-400 hover:underline">official@edusync.ph</a>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Support: <a href="mailto:support@edusync.ph" className="text-indigo-600 dark:text-indigo-400 hover:underline">support@edusync.ph</a>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Website: <a href="https://edusync.ph" className="text-indigo-600 dark:text-indigo-400 hover:underline">https://edusync.ph</a>
              </p>
            </div>
          </section>

          {/* National Privacy Commission */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">National Privacy Commission</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have concerns about how we handle your personal data, you may file a complaint with the National Privacy Commission:
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-2">
              <p className="text-gray-900 dark:text-white font-semibold">National Privacy Commission</p>
              <p className="text-gray-700 dark:text-gray-300">5th Floor, Philippine International Convention Center (PICC)</p>
              <p className="text-gray-700 dark:text-gray-300">Vicente Sotto Avenue, Pasay City, Metro Manila 1307</p>
              <p className="text-gray-700 dark:text-gray-300">Email: info@privacy.gov.ph</p>
              <p className="text-gray-700 dark:text-gray-300">Website: https://privacy.gov.ph</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
