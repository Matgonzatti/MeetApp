import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';

class ScheduleController {
  async index(req, res) {
    const { date, page = 1 } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Invalid date.' });
    }

    const parseDate = parseISO(date);

    const schedule = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(parseDate), endOfDay(parseDate)],
        },
      },
      include: {
        model: User,
        as: 'user',
        attributes: ['name', 'email'],
      },
      order: ['date'],
      limit: 10,
      offset: (page - 1) * 10,
    });

    return res.json(schedule);
  }
}

export default new ScheduleController();
