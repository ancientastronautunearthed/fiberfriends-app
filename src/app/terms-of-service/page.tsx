
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Terms of Service</CardTitle>
          <CardDescription>Last Updated: [Date]</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90 leading-relaxed">
          <p>
            Please read these Terms of Service ("Terms", "Terms of Service")
            carefully before using the Fiber Friends application (the "Service")
            operated by [Your Company Name/Your Name] ("us", "we", or "our").
          </p>
          <p>
            Your access to and use of the Service is conditioned on your
            acceptance of and compliance with these Terms. These Terms apply to
            all visitors, users, and others who access or use the Service.
          </p>
          <p>
            By accessing or using the Service you agree to be bound by these
            Terms. If you disagree with any part of the terms then you may not
            access the Service.
          </p>

          <h2 className="text-xl font-semibold font-headline pt-4">1. Accounts</h2>
          <p>
            When you create an account with us, you must provide us information
            that is accurate, complete, and current at all times. Failure to do
            so constitutes a breach of the Terms, which may result in immediate
            termination of your account on our Service.
          </p>
          <p>
            You are responsible for safeguarding the password that you use to
            access the Service and for any activities or actions under your
            password, whether your password is with our Service or a third-party
            service.
          </p>

          <h2 className="text-xl font-semibold font-headline pt-4">2. Medical Disclaimer</h2>
          <p>
            The information provided by Fiber Friends, including AI-generated insights,
            is for informational and educational purposes only and does not constitute
            medical advice, diagnosis, or treatment. Always seek the advice of your
            physician or other qualified health provider with any questions you may
            have regarding a medical condition. Never disregard professional medical
            advice or delay in seeking it because of something you have read or
            interacted with on this Service.
          </p>
          <p>
            Fiber Friends does not recommend or endorse any specific tests, physicians,
            products, procedures, opinions, or other information that may be mentioned
            on the Service. Reliance on any information provided by Fiber Friends,
            Fiber Friends employees, others appearing on the Service at the invitation
            of Fiber Friends, or other visitors to the Service is solely at your own risk.
          </p>
          
          <h2 className="text-xl font-semibold font-headline pt-4">3. User Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise make
            available certain information, text, graphics, videos, or other material
            ("Content"). You are responsible for the Content that you post on or through
            the Service, including its legality, reliability, and appropriateness.
          </p>
          <p>
            You retain any and all of your rights to any Content you submit, post or
            display on or through the Service and you are responsible for protecting
            those rights. We take no responsibility and assume no liability for Content
            you or any third party posts on or through the Service.
          </p>


          <h2 className="text-xl font-semibold font-headline pt-4">4. Subscriptions (If Applicable)</h2>
          <p>
            Some parts of the Service may be billed on a subscription basis
            ("Subscription(s)"). You will be billed in advance on a recurring and
            periodic basis ("Billing Cycle"). Billing cycles are set either on a
            monthly or annual basis, depending on the type of subscription plan
            you select when purchasing a Subscription.
          </p>
          <p>
            At the end of each Billing Cycle, your Subscription will automatically
            renew under the exact same conditions unless you cancel it or
            [Your Company Name/Your Name] cancels it. You may cancel your
            Subscription renewal either through your online account management page
            or by contacting [Your Company Name/Your Name] customer support team.
          </p>
          <p>
            A valid payment method, including credit card, is required to process
            the payment for your Subscription. You shall provide [Your Company Name/Your Name]
            with accurate and complete billing information including full name, address,
            state, zip code, telephone number, and a valid payment method information.
            By submitting such payment information, you automatically authorize
            [Your Company Name/Your Name] to charge all Subscription fees incurred through
            your account to any such payment instruments.
          </p>
          <p>
            [Further details about free trials, fee changes, refunds etc. to be added]
          </p>

          <h2 className="text-xl font-semibold font-headline pt-4">5. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior
            notice or liability, for any reason whatsoever, including without
            limitation if you breach the Terms.
          </p>

          <h2 className="text-xl font-semibold font-headline pt-4">6. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the
            laws of [Your Jurisdiction, e.g., State of California, United States],
            without regard to its conflict of law provisions.
          </p>

          <h2 className="text-xl font-semibold font-headline pt-4">7. Changes</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. If a revision is material we will try to
            provide at least 30 days' notice prior to any new terms taking
            effect. What constitutes a material change will be determined at our
            sole discretion.
          </p>

          <h2 className="text-xl font-semibold font-headline pt-4">8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us:
            [Your Contact Email/Link to Contact Form]
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Return to <Link href="/landing" className="text-primary hover:underline">Landing Page</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
