const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkFieldErrors(body, { requireAll }) {
  const errors = [];

  if (requireAll && (typeof body !== "object" || body === null || Array.isArray(body))) {
    return ["Request body must be a JSON object"];
  }

  const name = body.name;
  const email = body.email;
  const course = body.course;
  const semester = body.semester;

  if (name !== undefined || requireAll) {
    if (typeof name !== "string" || name.trim().length === 0) {
      errors.push("name is required and must be a non-empty string");
    } else if (name.length > 100) {
      errors.push("name must not exceed 100 characters");
    }
  }

  if (email !== undefined || requireAll) {
    if (typeof email !== "string" || email.trim().length === 0) {
      errors.push("email is required and must be a non-empty string");
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push("email must be a valid email address");
    }
  }

  if (course !== undefined || requireAll) {
    if (typeof course !== "string" || course.trim().length === 0) {
      errors.push("course is required and must be a non-empty string");
    }
  }

  if (semester !== undefined || requireAll) {
    if (!Number.isInteger(semester)) {
      errors.push("semester is required and must be an integer");
    } else if (semester < 1 || semester > 12) {
      errors.push("semester must be between 1 and 12");
    }
  }

  const allowed = ["name", "email", "course", "semester"];
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    errors.push(`unknown field(s): ${unknown.join(", ")}`);
  }

  if (!requireAll && Object.keys(body).length === 0) {
    errors.push("request body must contain at least one updatable field");
  }

  return errors;
}

function validateStudent(req, res, next) {
  const errors = checkFieldErrors(req.body ?? {}, { requireAll: true });
  if (errors.length > 0) {
    return res.status(400).json({ error: "Bad Request", message: "Validation failed", details: errors });
  }
  next();
}

function validatePartialStudent(req, res, next) {
  const errors = checkFieldErrors(req.body ?? {}, { requireAll: false });
  if (errors.length > 0) {
    return res.status(400).json({ error: "Bad Request", message: "Validation failed", details: errors });
  }
  next();
}

module.exports = { validateStudent, validatePartialStudent };
