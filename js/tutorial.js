const Tutorial = {
  init() {
  },

  steps: [
    {
      title: 'Sign in to Luno',
      desc: 'Go to <a href="https://www.luno.com" target="_blank" rel="noopener">luno.com</a> and sign in. Click your initials in the top-left corner to open the profile menu, then select <strong>Security</strong>.',
      image: CONFIG.TUTORIAL_IMAGES.step1,
      highlight: false,
    },
    {
      title: 'Navigate to API Keys',
      desc: 'From the Security menu, locate and click on <strong>API keys</strong>. This is where you manage all your existing and new API keys.',
      image: CONFIG.TUTORIAL_IMAGES.step2,
      highlight: false,
    },
    {
      title: 'Click "CREATE API KEY"',
      desc: 'Select the <strong>CREATE API KEY</strong> button to start creating a new key.',
      image: CONFIG.TUTORIAL_IMAGES.step3,
      highlight: false,
    },
    {
      title: 'Choose Permissions \u2014 Select READ-ONLY',
      desc: 'Give your key a name (e.g., "Luno Dashboard") and <strong>select Read-only access</strong>. This is the safest option and sufficient for this dashboard.',
      image: CONFIG.TUTORIAL_IMAGES.step4,
      highlight: true,
      warning: 'For your security, this dashboard only needs "Read-only" permissions. Never grant "Trading access" to third-party tools unless you fully trust them and understand the risks.',
      permissions: CONFIG.REQUIRED_PERMISSIONS,
    },
    {
      title: 'Copy Your API Key Details',
      desc: 'Make sure to copy both the <strong>Key ID</strong> and <strong>Secret</strong> immediately. The Secret can only be viewed once \u2014 if you lose it, you will need to create a new API key.',
      image: CONFIG.TUTORIAL_IMAGES.step5,
      highlight: false,
    },
    {
      title: 'Click "CREATE API KEY"',
      desc: 'After copying your Key ID and Secret, click the confirmation button to finalise your API key.',
      image: '',
      highlight: false,
    },
    {
      title: 'Authorize via Push Notification or Email',
      desc: 'Luno will send a push notification to the Luno app or an email to confirm this action. Approve it to activate your API key.',
      image: CONFIG.TUTORIAL_IMAGES.step7,
      highlight: false,
    },
  ],

  goBack() {
    Router.go(CONFIG.ROUTES.SETUP);
  },
};
