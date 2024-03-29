import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';
import errorMessages from '../constants/ErrorMessages';

class UserController {
  async create(req, res) {
    // Validação dos campos com o Yup
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      phone: Yup.string().required().min(8).max(11),
      password: Yup.string().required().min(8),
      confirmParssword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: errorMessages.yup_validation_failed });
    }

    // Verificação de unicidade do email
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (user) {
      return res
        .status(400)
        .json({ error: errorMessages.email_already_exists });
    }

    const { id, name, email, phone } = await User.create(req.body);

    return res.json({
      id,
      name,
      email,
      phone,
    });
  }

  async listOne(req, res) {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'phone'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    return res.json(user);
  }

  async update(req, res) {
    // Validação dos campos com o Yup
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      phone: Yup.string().min(8).max(11),
      oldPassword: Yup.string().min(8),
      password: Yup.string()
        .min(8)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: errorMessages.yup_validation_failed });
    }

    const { email, phone, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email && email !== user.email) {
      // Verificação de unicidade do email
      const userExists = await User.findOne({
        where: {
          email,
        },
      });

      if (userExists) {
        return res
          .status(400)
          .json({ error: errorMessages.email_already_exists });
      }
    }

    if (phone && phone !== user.phone) {
      // Verificação de unicidade do celular
      const userExists = await User.findOne({
        where: {
          phone,
        },
      });

      if (userExists) {
        return res
          .status(400)
          .json({ error: errorMessages.phone_already_exists });
      }
    }

    // Conferindo se a senha informada bate com a senha atual, em caso de alteração de senha
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(400).json({ error: errorMessages.password_not_match });
    }

    const { id, name } = await user.update(req.body);

    return res.json({
      id,
      name,
      email: email || user.email,
      phone: phone || user.phone,
    });
  }
}

export default new UserController();
