exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE category
      ALTER COLUMN icon TYPE VARCHAR(60);

    UPDATE category
    SET icon = CASE icon
      WHEN '💻' THEN 'laptop'
      WHEN '📱' THEN 'mobile-screen'
      WHEN '🎧' THEN 'headphones'
      WHEN '🖥️' THEN 'desktop'
      WHEN '🖥' THEN 'desktop'
      WHEN '🎮' THEN 'gamepad'
      WHEN '⚡' THEN 'bolt'
      WHEN '🔧' THEN 'screwdriver-wrench'
      ELSE icon
    END
    WHERE icon IS NOT NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    UPDATE category
    SET icon = CASE icon
      WHEN 'laptop' THEN '💻'
      WHEN 'mobile-screen' THEN '📱'
      WHEN 'headphones' THEN '🎧'
      WHEN 'desktop' THEN '🖥️'
      WHEN 'gamepad' THEN '🎮'
      WHEN 'bolt' THEN '⚡'
      WHEN 'screwdriver-wrench' THEN '🔧'
      ELSE icon
    END
    WHERE icon IN (
      'laptop', 'mobile-screen', 'headphones', 'desktop', 'gamepad',
      'bolt', 'screwdriver-wrench'
    );

    ALTER TABLE category
      ALTER COLUMN icon TYPE VARCHAR(10);
  `);
};
