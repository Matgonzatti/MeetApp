import { isBefore } from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';
import User from '../models/User';

class SubscriptionController {
  async store(req, res) {
    const meetup = await Meetup.findOne({
      where: {
        id: req.params.id,
      },
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
    });

    if (meetup.user_id === req.userId) {
      return res.status(401).json({
        error: "You can only subscribe meetup that you don't organize",
      });
    }

    if (isBefore(meetup.date, new Date())) {
      return res
        .status(401)
        .json({ error: 'This meetup has already happened ' });
    }

    const isSubscribe = await Subscription.findOne({
      where: {
        user_id: req.userId,
        meetup_id: req.params.id,
      },
    });

    if (isSubscribe) {
      return res
        .status(401)
        .json({ error: 'You already subscribe for this meetup' });
    }

    const isSubscribeSameTime = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: {
        model: Meetup,
        as: 'meetup',
        where: {
          date: meetup.date,
        },
      },
    });

    if (isSubscribeSameTime) {
      return res.status(401).json({
        error: 'You cannot subscribe for two meetups at the same time. ',
      });
    }

    const subscription = await Subscription.create({
      user_id: req.userId,
      meetup_id: meetup.id,
    });

    const user = await User.findOne({
      where: {
        id: req.userId,
      },
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
    });

    return res.json(subscription);
  }

  async index(req, res) {
    const subscriptions = await Meetup.findAll({
      where: {
        date: {
          [Op.gt]: new Date(),
        },
      },
      attributes: ['title', 'description', 'location', 'date'],
      include: [
        {
          model: Subscription,
          attributes: ['user_id'],
          where: {
            user_id: req.userId,
          },
        },
      ],
      order: ['date'],
    });

    return res.json(subscriptions);
  }
}

export default new SubscriptionController();
