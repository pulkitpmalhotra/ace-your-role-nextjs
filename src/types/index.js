// Type definitions converted to JSDoc comments for documentation

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} [full_name]
 * @property {string} [company]
 * @property {string} [role]
 * @property {string} created_at
 * @property {string} updated_at
 * @property {UserPreferences} [preferences]
 */

/**
 * @typedef {Object} UserPreferences
 * @property {boolean} notifications
 * @property {'light'|'dark'} theme
 * @property {string} language
 * @property {'basic'|'enhanced'} privacy_level
 */

/**
 * @typedef {Object} Scenario
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} character_name
 * @property {string} character_role
 * @property {string} character_personality
 * @property {'beginner'|'intermediate'|'advanced'} difficulty
 * @property {string} category
 * @property {string} [subcategory]
 * @property {string[]} [tags]
 * @property {string[]} [learning_objectives]
 * @property {number} [estimated_duration_minutes]
 * @property {boolean} is_active
 * @property {string} created_at
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} scenario_id
 * @property {string} user_email
 * @property {string} start_time
 * @property {string} [end_time]
 * @property {number} [duration_minutes]
 * @property {ConversationMessage[]} conversation
 * @property {number} [overall_score]
 * @property {string} [detailed_feedback]
 * @property {Scenario} [scenarios]
 */

/**
 * @typedef {Object} ConversationMessage
 * @property {'user'|'ai'} speaker
 * @property {string} message
 * @property {number} timestamp
 */

/**
 * @typedef {Object} FeedbackCategory
 * @property {number} score
 * @property {string} feedback
 * @property {string[]} suggestions
 */

/**
 * @typedef {Object} DetailedFeedback
 * @property {number} overallScore
 * @property {Object} categories
 * @property {FeedbackCategory} categories.opening
 * @property {FeedbackCategory} categories.discovery
 * @property {FeedbackCategory} categories.presentation
 * @property {FeedbackCategory} categories.objection
 * @property {FeedbackCategory} categories.closing
 * @property {Object} overall
 * @property {string[]} overall.strengths
 * @property {string[]} overall.improvements
 * @property {string} overall.nextFocus
 */

/**
 * @typedef {Object} APIResponse
 * @property {boolean} success
 * @property {*} [data]
 * @property {string} [error]
 * @property {Object} [meta]
 * @property {number} [meta.total]
 * @property {Object} [meta.filters]
 */

/**
 * @typedef {Object} ScenarioFilters
 * @property {string} category
 * @property {string} difficulty
 * @property {string} subcategory
 * @property {string} search
 * @property {string} tags
 * @property {number} [limit]
 */

/**
 * @typedef {Object} AIResponseData
 * @property {string} response
 * @property {string} character
 * @property {string} emotion
 * @property {string} gender
 */

// Export empty object for compatibility
export default {};
