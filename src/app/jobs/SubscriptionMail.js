import Mail from '../../lib/Mail';

class SubscriptionMail {
  get() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetup, user } = data;

    await Mail.sendMail({
      to: `${meetup.user.name} <${meetup.user.email}>`,
      subject: 'Inscrição no meetup',
      template: 'subscription',
      context: {
        user: meetup.user.name,
        subscribed: user.name,
        title: meetup.title,
        description: meetup.description,
        location: meetup.location,
      },
    });
  }
}

export default new SubscriptionMail();
