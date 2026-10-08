@file:OptIn(ExperimentalJsExport::class)

package cheatahh.portfolio.resume

import cheatahh.portfolio.content.Experience
import cheatahh.portfolio.content.Portfolio
import cheatahh.portfolio.content.portfolio
import kotlin.js.JsExport

@JsExport
fun resumeHtml() = ResumeHtml(portfolio()).render()

@JsExport
fun resumeMarkdown() = ResumeMarkdown(portfolio()).render()

@JsExport
fun resumeJsonLd() = profilePageJsonLd(portfolio())

@JsExport
fun llmTxt(): String {
    val p = portfolio()
    val profile = p.profile
    return buildString {
        appendLine("# ${profile.name}")
        appendLine()
        appendLine("> ${profile.role} (${profile.focus.joinToString(", ")}), based in ${profile.location}. ${profile.tagline}")
        appendLine()
        profile.about.forEach { appendLine(it).appendLine() }
        appendLine("## Resume")
        appendLine()
        appendLine("- [Full CV (Markdown)](/resume.md): experience, education, thesis, projects, skills and languages")
        appendLine()
        appendLine("## Links")
        appendLine()
        profile.email?.let { appendLine("- [Email](mailto:$it)") }
        profile.links.forEach { appendLine("- [${it.label}](${it.url})") }
    }
}

private fun Experience.headline() = "$role, $company"

private class ResumeHtml(private val p: Portfolio) {
    private val out = StringBuilder()
    fun render(): String {
        val profile = p.profile
        out.append("<article class=\"static-resume\" itemscope itemtype=\"https://schema.org/Person\">")
        out.append("<header>")
        tag("h1", profile.name, "itemprop=\"name\"")
        tag("p", "${profile.role} · ${profile.focus.joinToString(" · ")}", "itemprop=\"jobTitle\"")
        tag("p", "${profile.location} · ${profile.availability}")
        out.append("<ul>")
        profile.email?.let { out.append("<li>Email: <a href=\"mailto:${esc(it)}\" itemprop=\"email\">${esc(it)}</a></li>") }
        profile.links.forEach {
            out.append("<li>${esc(it.label)}: <a href=\"${esc(it.url)}\" itemprop=\"sameAs\">${esc(it.url)}</a></li>")
        }
        out.append("</ul></header>")
        section("Summary") {
            tag("p", profile.tagline)
            profile.about.forEach { tag("p", it) }
        }
        section("Experience") {
            p.experience.forEach { job ->
                out.append("<article>")
                tag("h3", job.headline())
                tag("p", listOf(job.department, job.location).joinToString(" · "))
                tag("p", job.period)
                bullets(job.points)
                job.rotations.forEach { r ->
                    tag("h4", "${r.role}, ${r.department}")
                    tag("p", r.period)
                    tag("p", r.summary)
                }
                if (job.tags.isNotEmpty()) tag("p", "Technologies: ${job.tags.joinToString(", ")}")
                out.append("</article>")
            }
        }
        section("Education") {
            p.education.forEach { edu ->
                out.append("<article>")
                tag("h3", "${edu.degree}, ${edu.school}")
                tag("p", "${edu.location} · ${edu.period} · ${edu.status}")
                bullets(edu.points)
                out.append("</article>")
            }
        }
        section("Skills") {
            out.append("<ul>")
            p.skills.forEach { group ->
                out.append("<li><strong>${esc(group.name)}:</strong> ${esc(group.skills.joinToString(", "))}</li>")
            }
            out.append("</ul>")
        }
        section("Master's Thesis") {
            val thesis = p.thesis
            tag("h3", thesis.title)
            tag("p", thesis.degree)
            tag("p", thesis.summary)
            tag("p", "Pipeline: ${thesis.pipeline.joinToString(" → ")}")
            tag("p", "Code generation backends: ${thesis.backends.joinToString(", ")}")
            tag("p", "Benchmarked against: ${thesis.baselines.joinToString(", ")}")
            tag("h4", "Methodology")
            bullets(thesis.methods)
            tag("h4", "Research questions")
            bullets(thesis.questions.map { "${it.id} (${it.topic}): ${it.question}" }.toTypedArray())
        }
        section("Projects") {
            p.projects.forEach { project ->
                out.append("<article>")
                tag("h3", project.title)
                tag("p", project.kind)
                tag("p", project.description)
                bullets(project.points)
                if (project.tags.isNotEmpty()) tag("p", "Technologies: ${project.tags.joinToString(", ")}")
                out.append("</article>")
            }
        }
        section("Languages") {
            bullets(p.languages.map { "${it.name}: ${it.level}" }.toTypedArray())
        }
        out.append("</article>")
        return out.toString()
    }
    private fun section(title: String, body: () -> Unit) {
        out.append("<section>")
        tag("h2", title)
        body()
        out.append("</section>")
    }
    private fun tag(name: String, text: String, attributes: String = "") {
        val attrs = if (attributes.isEmpty()) "" else " $attributes"
        out.append("<$name$attrs>${esc(text)}</$name>")
    }
    private fun bullets(items: Array<String>) {
        if (items.isEmpty()) return
        out.append("<ul>")
        items.forEach { out.append("<li>${esc(it)}</li>") }
        out.append("</ul>")
    }
}

internal fun esc(text: String) = buildString(text.length) {
    for (c in text) when (c) {
        '&' -> append("&amp;")
        '<' -> append("&lt;")
        '>' -> append("&gt;")
        '"' -> append("&quot;")
        '\'' -> append("&#39;")
        else -> append(c)
    }
}


private class ResumeMarkdown(private val p: Portfolio) {
    private val out = StringBuilder()
    fun render(): String {
        val profile = p.profile
        line("# ${profile.name}")
        line()
        line("**${profile.role}** · ${profile.focus.joinToString(" · ")}")
        line()
        line("${profile.location} · ${profile.availability}")
        line()
        profile.email?.let { line("- Email: $it") }
        profile.links.forEach { line("- ${it.label}: ${it.url}") }
        heading("Summary")
        line(profile.tagline)
        profile.about.forEach { line(); line(it) }
        heading("Experience")
        p.experience.forEachIndexed { i, job ->
            if (i > 0) line()
            line("### ${job.headline()}")
            line()
            line("${job.period} · ${job.department} · ${job.location}")
            if (job.points.isNotEmpty()) line()
            job.points.forEach { line("- $it") }
            job.rotations.forEach { r ->
                line()
                line("#### ${r.role}, ${r.department} (${r.period})")
                line()
                line(r.summary)
            }
            if (job.tags.isNotEmpty()) {
                line()
                line("Technologies: ${job.tags.joinToString(", ")}")
            }
        }
        heading("Education")
        p.education.forEachIndexed { i, edu ->
            if (i > 0) line()
            line("### ${edu.degree}, ${edu.school}")
            line()
            line("${edu.period} · ${edu.location} · ${edu.status}")
            if (edu.points.isNotEmpty()) line()
            edu.points.forEach { line("- $it") }
        }
        heading("Skills")
        p.skills.forEach { line("- **${it.name}:** ${it.skills.joinToString(", ")}") }
        heading("Master's Thesis")
        val thesis = p.thesis
        line("### ${thesis.title}")
        line()
        line(thesis.degree)
        line()
        line(thesis.summary)
        line()
        line("- Pipeline: ${thesis.pipeline.joinToString(" → ")}")
        line("- Code generation backends: ${thesis.backends.joinToString(", ")}")
        line("- Benchmarked against: ${thesis.baselines.joinToString(", ")}")
        line()
        line("Methodology:")
        line()
        thesis.methods.forEach { line("- $it") }
        line()
        line("Research questions:")
        line()
        thesis.questions.forEach { line("- **${it.id} (${it.topic}):** ${it.question}") }
        heading("Projects")
        p.projects.forEachIndexed { i, project ->
            if (i > 0) line()
            line("### ${project.title}")
            line()
            line("*${project.kind}.* ${project.description}")
            if (project.points.isNotEmpty()) line()
            project.points.forEach { line("- $it") }
            if (project.tags.isNotEmpty()) {
                line()
                line("Technologies: ${project.tags.joinToString(", ")}")
            }
        }
        heading("Languages")
        p.languages.forEach { line("- ${it.name}: ${it.level}") }
        return out.toString()
    }
    private fun heading(title: String) {
        line()
        line("## $title")
        line()
    }
    private fun line(text: String = "") {
        out.append(text).append('\n')
    }
}

private fun profilePageJsonLd(p: Portfolio): String {
    val profile = p.profile
    val employers = p.experience.map { it.company }.distinct()
    val current = p.experience.firstOrNull { it.current }
    val person = obj(
        "@type" to str("Person"),
        "name" to str(profile.name),
        "jobTitle" to str(current?.role ?: profile.role),
        "description" to str(profile.tagline),
        "email" to profile.email?.let { str("mailto:$it") },
        "address" to obj("@type" to str("PostalAddress"), "addressCountry" to str(profile.location)),
        "sameAs" to arr(profile.links.map { str(it.url) }),
        "worksFor" to current?.let { obj("@type" to str("Organization"), "name" to str(it.company)) },
        "alumniOf" to arr(
            p.education.map { obj("@type" to str("CollegeOrUniversity"), "name" to str(it.school)) } +
                employers.filter { it != current?.company }.map { obj("@type" to str("Organization"), "name" to str(it)) },
        ),
        "hasOccupation" to arr(p.experience.map { job ->
            obj(
                "@type" to str("Occupation"),
                "name" to str(job.role),
                "description" to str((job.points.toList() + job.rotations.map { "${it.role}: ${it.summary}" }).joinToString(" ")),
                "skills" to str(job.tags.joinToString(", ")),
            )
        }),
        "knowsAbout" to arr(p.skills.flatMap { it.skills.toList() }.distinct().map(::str)),
        "knowsLanguage" to arr(p.languages.map { str(it.name) }),
    )
    return obj(
        "@context" to str("https://schema.org"),
        "@type" to str("ProfilePage"),
        "mainEntity" to person,
    )
}

private fun str(value: String) = buildString {
    append('"')
    for (c in value) when {
        c == '"' -> append("\\\"")
        c == '\\' -> append("\\\\")
        c == '\n' -> append("\\n")
        c == '<' -> append("\\u003c")
        c < ' ' -> append("\\u").append(c.code.toString(16).padStart(4, '0'))
        else -> append(c)
    }
    append('"')
}

private fun obj(vararg entries: Pair<String, String?>) =
    entries.filter { it.second != null }.joinToString(",", "{", "}") { (key, value) -> "${str(key)}:$value" }

private fun arr(values: List<String>) = values.joinToString(",", "[", "]")

internal fun jsonString(value: String) = str(value)
