@file:OptIn(ExperimentalJsExport::class)

package cheatahh.portfolio.content

import kotlin.js.JsExport

@JsExport
class Link(
    val kind: String,
    val label: String,
    val url: String,
)

@JsExport
class Stat(
    val value: String,
    val label: String,
)

@JsExport
class Profile(
    val name: String,
    val role: String,
    val focus: Array<String>,
    val tagline: String,
    val location: String,
    val availability: String,
    val about: Array<String>,
    val email: String?,
    val links: Array<Link>,
    val stats: Array<Stat>,
)

@JsExport
class Rotation(
    val role: String,
    val department: String,
    val period: String,
    val summary: String,
)

@JsExport
class Experience(
    val role: String,
    val company: String,
    val department: String,
    val location: String,
    val period: String,
    val current: Boolean,
    val points: Array<String>,
    val rotations: Array<Rotation>,
    val tags: Array<String>,
)

@JsExport
class ResearchQuestion(
    val id: String,
    val topic: String,
    val question: String,
)

@JsExport
class Thesis(
    val title: String,
    val degree: String,
    val summary: String,
    val pipeline: Array<String>,
    val backends: Array<String>,
    val baselines: Array<String>,
    val methods: Array<String>,
    val questions: Array<ResearchQuestion>,
)

@JsExport
class Project(
    val title: String,
    val kind: String,
    val description: String,
    val points: Array<String>,
    val tags: Array<String>,
)

@JsExport
class SkillGroup(
    val name: String,
    val skills: Array<String>,
)

@JsExport
class Education(
    val degree: String,
    val school: String,
    val location: String,
    val period: String,
    val status: String,
    val points: Array<String>,
)

@JsExport
class Language(
    val name: String,
    val level: String,
)

@JsExport
class Portfolio(
    val profile: Profile,
    val experience: Array<Experience>,
    val thesis: Thesis,
    val projects: Array<Project>,
    val skills: Array<SkillGroup>,
    val education: Array<Education>,
    val languages: Array<Language>,
)
