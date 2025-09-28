import spacy
from spacy.matcher import Matcher
import json

def analyze_conversation(text):
    """
    Analyzes a conversation to extract objectives, intent, assumptions, and action items using spaCy's Matcher.
    """
    nlp = spacy.load("en_core_web_sm")
    # Pre-process text to handle markdown and improve matching
    text = text.replace('**', '').replace('###', '')
    doc = nlp(text)
    matcher = Matcher(nlp.vocab)

    # Define more specific patterns to distinguish categories
    objective_patterns = [
        [{"LOWER": "concrete"}, {"LOWER": "task"}, {"LOWER": ":"}],
        [{"LEMMA": {"IN": ["build", "create", "implement", "develop", "add"]}}, {"POS": "NOUN"}]
    ]
    intent_patterns = [
        [{"LOWER": "abstract"}, {"LOWER": "goal"}, {"LOWER": ":"}],
        [{"LOWER": "goal"}, {"LOWER": "is"}, {"LOWER": "to"}],
        [{"LEMMA": {"IN": ["understand", "improve"]}}, {"POS": "NOUN"}]
    ]
    assumption_patterns = [
        [{"LOWER": "my"}, {"LOWER": "understanding"}, {"LOWER": "is"}],
        [{"LOWER": "i"}, {"LOWER": "believe"}],
        [{"LOWER": "i"}, {"LOWER": "assume"}]
    ]
    action_item_patterns = [
        # More specific verbs to avoid capturing objectives
        [{"LOWER": "i"}, {"LOWER": "will"}, {"LEMMA": {"IN": ["honor", "answer", "use", "embrace", "start", "research", "apply"]}}]
    ]

    matcher.add("Stated Objectives", objective_patterns)
    matcher.add("Inferred Intent", intent_patterns)
    matcher.add("Key Assumptions", assumption_patterns)
    matcher.add("Action Items", action_item_patterns)

    # Use sets to store results and avoid duplicates
    results = {
        "Stated Objectives": set(),
        "Inferred Intent": set(),
        "Key Assumptions": set(),
        "Action Items": set(),
        "Open Questions": set()
    }

    # Process matches and store the full sentence
    matches = matcher(doc)
    for match_id, start, end in matches:
        rule_id = nlp.vocab.strings[match_id]
        span = doc[start:end]
        results[rule_id].add(span.sent.text.strip())

    # Handle questions separately
    for sent in doc.sents:
        if sent.text.strip().endswith('?'):
            results["Open Questions"].add(sent.text.strip())

    # --- Post-processing to resolve overlaps ---
    # If a sentence is an objective, it shouldn't also be an intent or action item.
    # Objectives get the highest priority.
    objectives = results["Stated Objectives"]
    intents = results["Inferred Intent"] - objectives
    action_items = results["Action Items"] - objectives - intents

    # Combine final action items and questions
    action_items_and_questions = action_items.union(results["Open Questions"])

    # Final results, converting sets to lists for JSON serialization
    final_results = {
        "Stated Objectives": list(objectives),
        "Inferred Intent": list(intents),
        "Key Assumptions": list(results["Key Assumptions"]),
        "Action Items & Open Questions": list(action_items_and_questions)
    }

    return final_results

def generate_summary(analysis_results):
    """
    Generates a synthesized executive summary using a template-based approach.
    """
    # Find the primary objective and intent using specific markers
    objective_str = ""
    intent_str = ""

    for item in analysis_results.get("Stated Objectives", []):
        if "Concrete Task:" in item:
            objective_str = item.split(":", 1)[1].strip().replace("I will ", "").replace(".", "")

    for item in analysis_results.get("Inferred Intent", []):
        if "Abstract Goal:" in item:
            intent_str = item.split(":", 1)[1].strip().replace(".", "")
            # Ensure the intent starts with a lowercase letter for proper grammar
            if intent_str:
                intent_str = intent_str[0].lower() + intent_str[1:]

    # If both primary components are found, create a synthesized summary
    if objective_str and intent_str:
        summary_text = (
            f"The primary objective of this initiative is to {objective_str}. "
            f"This project serves the higher abstract goal of {intent_str}, "
            "enabling me to become a more effective and insightful collaborator."
        )
        return summary_text

    # Fallback to the original concatenation method if templates don't match
    objectives = analysis_results.get("Stated Objectives", [])
    intents = analysis_results.get("Inferred Intent", [])
    summary_sentences = objectives + intents
    summary_text = ' '.join(sentence.strip().replace('\n', ' ') for sentence in summary_sentences)

    if not summary_text:
        return "No summary could be generated."

    return summary_text

def generate_markdown(analysis_results, summary_text):
    """
    Generates a polished, narrative-driven Markdown report from the analysis results.
    """
    # Define the order and titles for the sections
    sections = {
        "Stated Objectives": "Stated Objectives",
        "Inferred Intent": "Inferred Intent",
        "Key Assumptions": "Key Assumptions",
        "Action Items & Open Questions": "Action Items & Open Questions"
    }

    # Start with the title and executive summary
    markdown_content = "# Project Brief\n\n"
    markdown_content += "## Executive Summary\n\n"
    markdown_content += f"{summary_text}\n\n"

    # Add each section to the report
    for key, title in sections.items():
        markdown_content += f"## {title}\n\n"
        items = analysis_results.get(key, [])
        if items:
            for item in items:
                # Use blockquotes for better readability of extracted sentences
                cleaned_item = item.strip().replace('\n', ' ')
                markdown_content += f"> {cleaned_item}\n\n"
        else:
            markdown_content += "*None identified.*\n\n"

    return markdown_content

def main():
    """
    Main function to run the briefing assistant.
    """
    # Read the conversation text from the sample file
    with open("briefing_assistant/sample_conversation.txt", "r") as f:
        conversation_text = f.read()

    analysis_results = analyze_conversation(conversation_text)

    # Generate the executive summary
    summary_text = generate_summary(analysis_results)

    # Generate the full markdown report
    markdown_output = generate_markdown(analysis_results, summary_text)

    # Write the Markdown output to a file
    with open("briefing_assistant/PROJECT_BRIEF.md", "w") as f:
        f.write(markdown_output)

    print("Project brief generated successfully: briefing_assistant/PROJECT_BRIEF.md")

if __name__ == "__main__":
    main()